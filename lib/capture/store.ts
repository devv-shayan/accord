import "server-only";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { BUCKET, cloudMode, cloudRequested, dataDirectory, encryptionConfigured, isLoopback } from "./config";

type Kind = "user" | "session" | "extension" | "capture" | "chunk" | "share";
interface Document<T> { id: string; kind: Kind; owner_id: string; data: T; revision: number; }
function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000) }) },
  });
}
interface StorageStatus { mode: "supabase" | "local"; ready: boolean; issue: string | null; }
let health: { key: string; expiresAt: number; result: Promise<StorageStatus> } | undefined;
export async function storageStatus(): Promise<StorageStatus> {
  if (!cloudRequested()) {
    const publicHost = process.env.VERCEL || (process.env.ACCORD_APP_URL && !isLoopback(new URL(process.env.ACCORD_APP_URL).hostname));
    return { mode: "local", ready: !publicHost, issue: publicHost ? "Cloud storage needs setup before you can connect an account." : null };
  }
  const unavailable = (issue: string): StorageStatus => ({ mode: "supabase", ready: false, issue });
  if (!cloudMode()) return unavailable("Cloud storage needs setup before you can connect an account.");
  if (!encryptionConfigured()) return unavailable("Private account storage needs setup before you can sign in.");
  const key = `${process.env.SUPABASE_URL}:${process.env.SUPABASE_SECRET_KEY}`;
  if (health?.key === key && health.expiresAt > Date.now()) return health.result;
  const result = (async () => {
    try {
      const client = admin();
      const [documents, locks, bucket] = await Promise.all([
        client.from("accord_documents").select("id").limit(1),
        client.from("accord_locks").select("id").limit(1),
        client.storage.getBucket(BUCKET),
      ]);
      if (documents.error || locks.error || bucket.error || !bucket.data) return unavailable("Cloud storage could not connect. Try again or check the account setup.");
      if (bucket.data.public) return unavailable("Recording storage must be private before you can connect an account.");
      return { mode: "supabase" as const, ready: true, issue: null };
    } catch { return unavailable("Cloud storage could not connect. Try again or check the account setup."); }
  })();
  health = { key, expiresAt: Date.now() + 30_000, result };
  return result;
}
function safe(value: string) {
  if (cloudRequested() && !cloudMode()) throw new Error("Set ACCORD cloud storage before you connect accounts.");
  if (!cloudMode() && (process.env.VERCEL || (process.env.ACCORD_APP_URL && !isLoopback(new URL(process.env.ACCORD_APP_URL).hostname)))) throw new Error("Set ACCORD storage before you connect accounts on a public site.");
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(value)) throw new Error("Invalid storage identifier.");
  return value;
}
function documentPath(kind: Kind, id: string) { return path.join(dataDirectory(), "documents", kind, `${safe(id)}.json`); }
export async function readDocument<T>(kind: Kind, id: string): Promise<Document<T> | null> {
  safe(id);
  if (cloudMode()) {
    const { data, error } = await admin().from("accord_documents").select("*").eq("kind", kind).eq("id", id).maybeSingle();
    if (error) throw new Error("The meeting store could not read this record.");
    return data as Document<T> | null;
  }
  try { return JSON.parse(await readFile(documentPath(kind, id), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function listDocuments<T>(kind: Kind, ownerId?: string, contains?: Record<string, unknown>): Promise<Array<Document<T>>> {
  safe(kind); if (ownerId) safe(ownerId);
  if (cloudMode()) {
    let query = admin().from("accord_documents").select("*").eq("kind", kind);
    if (ownerId) query = query.eq("owner_id", ownerId);
    if (contains) query = query.contains("data", contains);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(1000);
    if (error) throw new Error("The meeting store could not load your records.");
    return data as Array<Document<T>>;
  }
  let files: string[];
  try { files = await readdir(path.join(dataDirectory(), "documents", kind)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  const documents = await Promise.all(files.filter((file) => file.endsWith(".json")).map((file) => readDocument<T>(kind, file.slice(0, -5))));
  return documents.filter((item): item is Document<T> => !!item && (!ownerId || item.owner_id === ownerId) &&
    (!contains || Object.entries(contains).every(([key, value]) => (item.data as Record<string, unknown>)[key] === value)));
}
export async function writeDocument<T>(kind: Kind, id: string, ownerId: string, data: T) {
  safe(id); safe(ownerId);
  const document = { kind, id, owner_id: ownerId, data };
  if (cloudMode()) {
    const { error } = await admin().from("accord_documents").upsert(document, { onConflict: "kind,id" });
    if (error) throw new Error("The meeting store could not save this record.");
    return;
  }
  const filename = documentPath(kind, id);
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify({ ...document, revision: Date.now() }), { mode: 0o600 });
  await rename(temporary, filename);
}
export async function deleteDocument(kind: Kind, id: string) {
  if (cloudMode()) {
    const { error } = await admin().from("accord_documents").delete().eq("kind", kind).eq("id", safe(id));
    if (error) throw new Error("The meeting store could not remove this record.");
    return;
  }
  await unlink(documentPath(kind, id)).catch((error) => { if (error.code !== "ENOENT") throw error; });
}
// An expiring database lock makes chunk updates and processing claims atomic across servers.
// Locally, the lock file is exclusive. It also survives a server restart.
export async function withLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  safe(id);
  const token = randomUUID();
  const filename = path.join(dataDirectory(), "locks", `${id}.lock`);
  if (cloudMode()) {
    const { data, error } = await admin().rpc("accord_acquire_lock", { lock_id: id, lock_token: token });
    if (error || !data) throw new Error("This recording is busy. Try again in a few seconds.");
  } else {
    await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
    try { await writeFile(filename, JSON.stringify({ token, at: Date.now() }), { flag: "wx", mode: 0o600 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const old = JSON.parse(await readFile(filename, "utf8"));
      if (Date.now() - old.at < 10 * 60_000) throw new Error("This recording is busy. Try again in a few seconds.");
      await unlink(filename);
      await writeFile(filename, JSON.stringify({ token, at: Date.now() }), { flag: "wx", mode: 0o600 });
    }
  }
  try { return await operation(); }
  finally {
    if (cloudMode()) await admin().rpc("accord_release_lock", { lock_id: id, lock_token: token });
    else await unlink(filename).catch(() => undefined);
  }
}
function blobPath(key: string) {
  safe("blob");
  if (!/^[a-zA-Z0-9_./-]+$/.test(key) || key.includes("..") || key.startsWith("/")) throw new Error("Invalid recording path.");
  return path.join(dataDirectory(), "audio", key);
}
export async function saveBlob(key: string, bytes: Uint8Array, contentType: string) {
  blobPath(key);
  if (cloudMode()) {
    const { error } = await admin().storage.from(BUCKET).upload(key, bytes, { contentType, upsert: true });
    if (error) throw new Error("The recording could not upload. Your local copy is kept.");
    return;
  }
  const filename = blobPath(key);
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  await writeFile(filename, bytes, { mode: 0o600 });
}
export async function loadBlob(key: string): Promise<Buffer> {
  blobPath(key);
  if (cloudMode()) {
    const { data, error } = await admin().storage.from(BUCKET).download(key);
    if (error || !data) throw new Error("The recording could not load.");
    return Buffer.from(await data.arrayBuffer());
  }
  return readFile(blobPath(key));
}
export async function removeBlob(key: string) {
  blobPath(key);
  if (cloudMode()) {
    const { error } = await admin().storage.from(BUCKET).remove([key]);
    if (error) throw new Error("The audio file could not be removed.");
    return;
  }
  await unlink(blobPath(key)).catch((error) => { if (error.code !== "ENOENT") throw error; });
}
