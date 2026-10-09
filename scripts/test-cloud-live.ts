// Real private-cloud test. Uses a supplied audio file and disposable QA accounts.
// It does not simulate Google consent or a browser recording.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { createSession, extensionToken } from "../lib/capture/auth";
import { BUCKET, cloudMode } from "../lib/capture/config";
import { deleteDocument, listDocuments, loadBlob, readDocument, removeBlob, storageStatus, withLock } from "../lib/capture/store";
import type { SharedAudio } from "../lib/capture/shares";
import type { CaptureSession, CaptureUser, UploadChunk } from "../lib/capture/types";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function cleanAccount(id: string) {
  assert.ok(id.startsWith("qa-cloud-"), "Cleanup is restricted to this test's accounts");
  const chunks = await listDocuments<UploadChunk>("chunk",id);
  const shares = await listDocuments<SharedAudio>("share",id);
  const captures = await listDocuments<CaptureSession>("capture",id);
  const blobs = new Set([...chunks.map(item => item.data.path), ...shares.map(item => item.data.audioPath), ...captures.flatMap(item => item.data.audioPath ? [item.data.audioPath] : [])]);
  for (const key of blobs) { assert.ok(key.startsWith(`${id}/`)); await removeBlob(key); }
  for (const kind of ["share","chunk","capture","extension","session","user"] as const) {
    for (const item of await listDocuments(kind,id)) await deleteDocument(kind,item.id);
  }
}
async function stopWorker(worker?: ChildProcess) {
  if (!worker || worker.exitCode !== null || worker.signalCode !== null) return;
  const exit = once(worker,"exit"); worker.kill("SIGTERM");
  const timeout = setTimeout(() => worker.kill("SIGKILL"),7000);
  await exit; clearTimeout(timeout);
}
async function run() {
  assert.ok(cloudMode(),"Configure a private Supabase project before running the cloud test");
  assert.equal((await storageStatus()).ready,true,"Private database and recording bucket must be available");
  const origin = new URL(process.env.ACCORD_TEST_URL || "http://localhost:3004").origin;
  assert.ok(["localhost","127.0.0.1"].includes(new URL(origin).hostname),"Use an isolated local server for this test");
  const connection = await fetch(`${origin}/api/connection`).then(response => response.json());
  assert.equal(connection.storage,"supabase"); assert.equal(connection.storageReady,true);
  assert.equal(connection.localMode,false,"The cloud test must not enable the local account route");
  const ids = [`qa-cloud-${randomUUID()}`,`qa-cloud-${randomUUID()}`];
  let worker: ChildProcess | undefined;
  let captureId: string | undefined;
  let processed = false;
  try {
    const users: CaptureUser[] = ids.map(id => ({ id, name:"Cloud storage test", email:`${id}@example.test`, local:true, calendarConnected:false }));
    const cookies = await Promise.all(users.map(async user => `accord_session=${await createSession(user)}`));
    const http = (route: string,method = "GET",body?: unknown,cookie = cookies[0],headers: Record<string,string> = {}) => fetch(`${origin}${route}`,{
      method, headers:{Cookie:cookie,Origin:origin,...(body && !(body instanceof Uint8Array) ? {"Content-Type":"application/json"} : {}),...headers},
      body: body instanceof Uint8Array ? new Uint8Array(body) : body ? JSON.stringify(body) : undefined,
    });
    const publicConnection = await http("/api/connection").then(response => response.json());
    assert.equal(publicConnection.user.id,users[0].id);
    assert.ok(!JSON.stringify(publicConnection).includes(process.env.SUPABASE_SECRET_KEY!));
    assert.equal((await http("/api/auth/local","POST")).status,403);
    await withLock(`qa-${ids[0]}`,async () => {
      await assert.rejects(withLock(`qa-${ids[0]}`,async () => undefined),/busy/);
    });
    const created = await http("/api/recordings","POST",{ title:"Maple · private cloud processing test",meetUrl:"https://meet.google.com/abc-defg-hij",mimeType:"audio/mpeg" });
    assert.equal(created.status,201); const { capture } = await created.json(); captureId = capture.id;
    const route = `/api/recordings/${capture.id}`;
    const audio = await readFile(process.env.ACCORD_TEST_AUDIO || path.join(process.cwd(),"public/audio/maple-source.mp3"));
    const split = Math.ceil(audio.length/2); const parts = [audio.subarray(0,split),audio.subarray(split)];
    for (let i = 0; i < parts.length; i++) assert.equal((await http(`${route}/chunks/${i}`,"PUT",parts[i],cookies[0],{"Content-Type":"audio/mpeg"})).status,200);
    assert.equal((await http(`${route}/chunks/0`,"PUT",parts[0],cookies[0],{"Content-Type":"audio/mpeg"})).status,200);
    const chunks = await listDocuments<UploadChunk>("chunk",users[0].id,{captureId:capture.id});
    assert.equal(chunks.length,2);
    for (const chunk of chunks) assert.equal(hash(await loadBlob(chunk.data.path)),chunk.data.hash);
    const finished = await http(`${route}/finish`,"POST",{chunkCount:2,durationSeconds:63,markers:[{seconds:25,label:"Cloud test mark"}]});
    assert.equal(finished.status,202);
    assert.equal((await readDocument<CaptureSession>("capture",capture.id))!.data.status,"queued","Start this server with ACCORD_EXTERNAL_WORKER=true");
    console.log("Cloud upload and durable queue passed. Starting a separate recording worker.");
    worker = spawn(process.execPath,["--conditions=react-server","--import","tsx","scripts/capture-worker.ts"],{cwd:process.cwd(),env:process.env,stdio:["ignore","pipe","pipe"]});
    worker.stdout?.pipe(process.stdout); worker.stderr?.pipe(process.stderr);
    let lastStatus = "queued";
    for (let attempt = 0; attempt < 150; attempt++) {
      await new Promise(resolve => setTimeout(resolve,2000));
      const current = (await readDocument<CaptureSession>("capture",capture.id))!.data;
      if (current.status !== lastStatus) { console.log(`Cloud processing: ${current.status}`); lastStatus = current.status; }
      if (current.status === "error") throw new Error(current.error);
      if (current.status === "ready") { processed = true; break; }
      if (worker.exitCode !== null) throw new Error("The recording worker stopped before processing finished");
    }
    assert.ok(processed,"The separate cloud worker must finish within five minutes");
    await stopWorker(worker);
    const ready = (await readDocument<CaptureSession>("capture",capture.id))!.data;
    assert.ok(ready.record!.transcript.length); assert.ok(ready.record!.actions.length);
    const privateUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ready.audioPath}`;
    assert.ok([400,401,403,404].includes((await fetch(privateUrl)).status),"Anonymous bucket URLs must not expose the recording");
    const ranged = await http(`${route}/audio`,"GET",undefined,cookies[0],{Range:"bytes=0-255"});
    assert.equal(ranged.status,206); assert.equal((await ranged.arrayBuffer()).byteLength,256);
    const state = (await http(`${route}/state`).then(response => response.json())).state;
    assert.equal(state.moments[0].label,"Cloud test mark");
    state.moments[0].label = "Saved cloud edit";
    state.actionOverrides[ready.record!.actions[0].id] = {completed:true};
    assert.equal((await http(`${route}/state`,"PUT",{state})).status,200);
    const reload = await http(`${route}/state`).then(response => response.json());
    assert.equal(reload.state.moments[0].label,"Saved cloud edit");
    assert.equal(reload.state.actionOverrides[ready.record!.actions[0].id].completed,true);
    const bytesHash = hash(await loadBlob(ready.audioPath!));
    const persisted = spawn(process.execPath,["--conditions=react-server","--import","tsx","--input-type=module","-e",
      'import {readDocument,loadBlob} from "./lib/capture/store.ts"; import {createHash} from "node:crypto"; const item = await readDocument("capture",process.env.ACCORD_QA_CAPTURE_ID); console.log(JSON.stringify({label:item.data.reviewState.moments[0].label,hash:createHash("sha256").update(await loadBlob(item.data.audioPath)).digest("hex")}));'],
      {cwd:process.cwd(),env:{...process.env,ACCORD_QA_CAPTURE_ID:capture.id},stdio:["ignore","pipe","pipe"]});
    let proof = ""; persisted.stdout!.on("data",chunk => {proof += chunk;});
    const [exitCode] = await once(persisted,"exit"); assert.equal(exitCode,0);
    assert.deepEqual(JSON.parse(proof),{label:"Saved cloud edit",hash:bytesHash},"A new server process must read the same private audio and edits");
    const shared = await http(`${route}/share`,"POST",{moment:reload.state.moments[0]});
    assert.equal(shared.status,200); const {sharePath} = await shared.json();
    assert.equal((await fetch(`${origin}${sharePath}`)).status,200);
    const token = sharePath.split("/").pop(); const clip = await fetch(`${origin}/api/shared-audio/${token}`);
    assert.equal(clip.status,200); assert.ok((await clip.arrayBuffer()).byteLength < (await loadBlob(ready.audioPath!)).byteLength);
    for (const endpoint of ["audio","state"]) {
      assert.equal((await fetch(`${origin}${route}/${endpoint}`)).status,401);
      assert.equal((await http(`${route}/${endpoint}`,"GET",undefined,cookies[1])).status,404);
    }
    assert.equal((await fetch(`${origin}/meetings/${capture.id}`)).status,404);
    const search = await http("/api/search?q=Maple","GET",undefined,cookies[1]).then(response => response.json());
    assert.ok(!JSON.stringify(search).includes(capture.id));
    assert.equal((await http(`${route}/state`,"PUT",{state},cookies[0],{Origin:"https://other.example"})).status,403);
    const extension = await extensionToken(users[0]);
    assert.equal((await fetch(`${origin}${route}/state`,{headers:{Authorization:`Bearer ${extension.token}`}})).status,401,"Extension access cannot read private review state");
    state.moments[0].label = "Changed cloud edit";
    assert.equal((await http(`${route}/state`,"PUT",{state})).status,200);
    assert.equal((await fetch(`${origin}/api/shared-audio/${token}`)).status,404,"Changing a moment must revoke the old clip");
    console.log(JSON.stringify({result:"PASS",storage:"Supabase private database and audio bucket",durationSeconds:ready.durationSeconds,transcriptPassages:ready.record!.transcript.length,actions:ready.record!.actions.length,
      checks:["private account sessions","cloud lock exclusion","multipart audio upload and retry","durable worker queue","actual Gemini processing in a separate worker","private playback and byte seeking","edits and audio survive a new server process","anonymous cropped clip","clip revocation","account and extension access separation","CSRF protection"]}));
  } finally {
    await stopWorker(worker);
    const current = captureId ? (await readDocument<CaptureSession>("capture",captureId))?.data : undefined;
    if (!current || !["transcribing","summarizing"].includes(current.status)) {
      for (const id of ids) await cleanAccount(id);
      console.log("Disposable cloud test accounts, records, and audio removed.");
    } else console.log("The unfinished cloud test record is retained for recovery.");
  }
}
void run().catch(error => { console.error(error instanceof Error ? error.message : "Cloud verification failed"); process.exitCode = 1; });
