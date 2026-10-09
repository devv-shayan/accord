import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloudMode, dataDirectory } from "./config";

export function opaqueToken() { return randomBytes(32).toString("base64url"); }
export function digest(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }

async function encryptionKey() {
  const configured = process.env.ACCORD_ENCRYPTION_KEY;
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length !== 32) throw new Error("ACCORD_ENCRYPTION_KEY must contain 32 bytes encoded as base64.");
    return key;
  }
  if (cloudMode() || process.env.VERCEL) throw new Error("Set ACCORD_ENCRYPTION_KEY before you connect Google.");
  await mkdir(dataDirectory(), { recursive: true, mode: 0o700 });
  const keyPath = path.join(dataDirectory(), "encryption.key");
  try { await writeFile(keyPath, randomBytes(32), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  return readFile(keyPath);
}
export async function encrypt(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}
export async function decrypt<T>(value: string): Promise<T> {
  const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", await encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString("utf8")) as T;
}
