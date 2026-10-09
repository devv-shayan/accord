// Use the private QA session created by test:capture:live. Never print its cookie.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function run() {
  const proof = JSON.parse(await readFile("/tmp/accord-capture-qa-session.json", "utf8"));
  const origin = new URL(proof.origin);
  assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname));
  const http = (route: string, method = "GET", body?: unknown, cookie = proof.cookie) => fetch(`${origin.origin}${route}`, {
    method, headers: { Cookie: cookie, Origin: origin.origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const route = `/api/recordings/${proof.captureId}`;
  const before = await http(`${route}/state`).then(response => response.json());
  const state = structuredClone(before.state);
  state.moments.push({ id: "http-verification", meetingId: proof.captureId, meetingTitle: "Upload test", label: "Saved edit test",
    startSeconds: 3, endSeconds: 5, createdAt: new Date().toISOString(), shared: false });
  let publicPath = "";
  try {
    assert.equal((await http(`${route}/state`, "PUT", { state })).status, 200, "The client and server must use the same state payload");
    const saved = await http(`${route}/state`).then(response => response.json());
    assert.equal(saved.state.moments.at(-1).label, "Saved edit test");
    assert.equal((await http(`${route}/state`, "PUT", { state: { ...state, actionOverrides: { task: { completed: "false" } } } })).status, 400);
    const shared = await http(`${route}/share`, "POST", { moment: state.moments.at(-1) });
    assert.equal(shared.status, 200); publicPath = (await shared.json()).sharePath;
    assert.equal((await fetch(`${origin.origin}${publicPath}`)).status, 200);
    const changed = await http(`${route}/state`).then(response => response.json());
    changed.state.moments.find((moment: { id: string }) => moment.id === "http-verification").label = "Edited moment";
    assert.equal((await http(`${route}/state`, "PUT", { state: changed.state })).status, 200);
    assert.equal((await fetch(`${origin.origin}/api/shared-audio/${publicPath.split("/").pop()}`)).status, 404, "Editing a moment must revoke its old link");
    assert.equal((await http(`${route}/retry`, "POST")).status, 409, "Ready recordings must not restart processing");
    assert.equal((await fetch(`${origin.origin}${route}/audio`)).status, 401);
    assert.equal((await fetch(`${origin.origin}${route}/state`)).status, 401);
    assert.equal((await fetch(`${origin.origin}/meetings/${proof.captureId}`)).status, 404);
    const stranger = await fetch(`${origin.origin}/api/auth/local`, { method: "POST", headers: { Origin: origin.origin } });
    const strangerCookie = stranger.headers.get("set-cookie")!.split(";")[0];
    assert.equal((await http(`${route}/state`, "GET", undefined, strangerCookie)).status, 404);
    assert.equal((await http(`${route}/audio`, "GET", undefined, strangerCookie)).status, 404);
    const search = await http("/api/search?q=Maple", "GET", undefined, strangerCookie).then(response => response.json());
    assert.ok(!JSON.stringify(search).includes(proof.captureId), "Search must not disclose another account's recording");
    console.log("PASS: durable state edits, rejected corrupt state, cropped sharing, edit revocation, ready-job protection, private pages/audio/state/search.");
  } finally {
    assert.equal((await http(`${route}/state`, "PUT", { state: before.state })).status, 200, "Restore the QA meeting changes");
  }
}
void run().catch(error => { console.error(error.message); process.exitCode = 1; });
