// This test uploads a supplied file. It does not claim to test browser capture.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createSession } from "../lib/capture/auth";
import { readDocument } from "../lib/capture/store";
import type { CaptureUser } from "../lib/capture/types";

async function run() {
  const origin = process.env.ACCORD_TEST_URL || "http://localhost:3003";
  if (!["localhost","127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("The live test requires a local, isolated Accord server.");
  const filename = process.env.ACCORD_TEST_AUDIO || path.join(process.cwd(),"public/audio/maple-source.mp3");
  const connection = await fetch(`${origin}/api/connection`).then(response => response.json());
  assert.equal(connection.localMode,true,"Start the isolated server with ACCORD_LOCAL_MODE=true");
  const auth = await fetch(`${origin}/api/auth/local`,{method:"POST",headers:{Origin:origin}});
  assert.equal(auth.status,200);
  let cookie = auth.headers.get("set-cookie")!.split(';')[0];
  if (process.env.ACCORD_TEST_USER) {
    const user = await readDocument<CaptureUser>("user",process.env.ACCORD_TEST_USER);
    assert.ok(user?.data.local,"Reuse is allowed only for an isolated local test account");
    cookie = `accord_session=${await createSession(user.data)}`;
  }
  const http = (route: string,method = "GET",body?: unknown,headers: Record<string,string> = {}) => fetch(`${origin}${route}`,{
    method,headers:{Cookie:cookie,Origin:origin,...(body && !(body instanceof Uint8Array) ? {"Content-Type":"application/json"} : {}),...headers},
    body: body instanceof Uint8Array ? new Uint8Array(body) : body ? JSON.stringify(body) : undefined,
  });
  const created = await http("/api/recordings","POST",{title:"Maple · supplied audio processing test",meetUrl:"https://meet.google.com/abc-defg-hij",mimeType:"audio/mpeg"});
  assert.equal(created.status,201); const {capture} = await created.json();
  const audio = await readFile(filename); const split = Math.ceil(audio.length / 2);
  const parts = [audio.subarray(0,split),audio.subarray(split)];
  for (let i=0;i<parts.length;i++) assert.equal((await http(`/api/recordings/${capture.id}/chunks/${i}`,"PUT",parts[i],{"Content-Type":"audio/mpeg"})).status,200);
  assert.equal((await http(`/api/recordings/${capture.id}/chunks/0`,"PUT",parts[0],{"Content-Type":"audio/mpeg"})).status,200,"Duplicate upload is idempotent");
  const finished = await http(`/api/recordings/${capture.id}/finish`,"POST",{chunkCount:2,durationSeconds:63,markers:[{seconds:25,label:"Marked in upload test"}]});
  assert.equal(finished.status,202);
  console.log(`Upload accepted: ${capture.id}. Waiting for actual Gemini transcription and notes.`);
  let ready;
  for (let attempt=0;attempt<150;attempt++) {
    await new Promise(resolve => setTimeout(resolve,2000));
    const result = await http("/api/recordings").then(response => response.json());
    const current = result.captures.find((recording: {id:string}) => recording.id === capture.id);
    if (current.status === "error") throw new Error(current.error);
    if (current.status === "ready") { ready = current; break; }
  }
  assert.ok(ready,"Processing must finish within five minutes");
  const saved = await http(`/api/recordings/${capture.id}/state`).then(response => response.json());
  assert.equal(saved.state.moments.length,1);
  const shared = await http(`/api/recordings/${capture.id}/share`,"POST",{moment:saved.state.moments[0]});
  assert.equal(shared.status,200); const {sharePath} = await shared.json();
  assert.ok(sharePath.startsWith("/share/"));
  const privateAudio = await fetch(`${origin}/api/recordings/${capture.id}/audio`); assert.equal(privateAudio.status,401);
  const ranged = await http(`/api/recordings/${capture.id}/audio`,"GET",undefined,{Range:"bytes=0-255"}); assert.equal(ranged.status,206); assert.equal((await ranged.arrayBuffer()).byteLength,256);
  const token = sharePath.split('/').pop(); const clip = await fetch(`${origin}/api/shared-audio/${token}`); assert.equal(clip.status,200);
  const output = await mkdtemp(path.join(os.tmpdir(),"accord-live-proof-"));
  await writeFile(path.join(output,"clip.webm"),Buffer.from(await clip.arrayBuffer()));
  const proof = { origin, captureId:capture.id, duration:ready.durationSeconds, sharePath, clipFile:path.join(output,"clip.webm"),
    checks:["multipart upload","duplicate part retry","actual Gemini processing","marker preservation","owner-only audio","range seeking","anonymous cropped clip"] };
  // The local QA cookie is kept in a private file for further HTTP checks, not printed.
  await writeFile('/tmp/accord-capture-qa-session.json',JSON.stringify({...proof,cookie}),{mode:0o600});
  console.log(JSON.stringify(proof,null,2));
}
void run().catch(error => { console.error(error.message); process.exitCode=1; });
