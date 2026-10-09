import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile, rm } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import { createSession, extensionToken, requestUser, requireUser, revokeExtensions, completeGoogleAuth } from "../lib/capture/auth";
import { encrypt, decrypt, opaqueToken } from "../lib/capture/crypto";
import { startCapture, uploadChunk, finishCapture, ownedCapture, assembleAudio } from "../lib/capture/service";
import { calendarEvents, meetAddress } from "../lib/capture/calendar";
import { audioResponse } from "../lib/capture/media";
import { validateTranscript } from "../lib/capture/transcription";
import { readDocument, writeDocument, withLock, loadBlob } from "../lib/capture/store";
import { createShare, invalidateShares, sharedAudio } from "../lib/capture/shares";
import { audioDuration, normalizeAudio } from "../lib/capture/audio";
import { accessibleMeeting, meetingCatalog } from "../lib/capture/meetings";
import { aiActionId, aiSummaryInsightId } from "../lib/review-count";
import { validReview } from "../lib/capture/review";
import type { CaptureSession, CaptureUser } from "../lib/capture/types";
import type { MeetingRecord } from "../lib/types";

const directory = mkdtempSync(path.join(os.tmpdir(),"accord-test-"));
process.env.ACCORD_DATA_DIR = directory; process.env.ACCORD_APP_URL = "http://localhost:3003";
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY;
after(() => rm(directory,{recursive:true,force:true}));
const user: CaptureUser = {id:"owner-one",name:"Recording test",email:"test.invalid",local:true,calendarConnected:false};
const other: CaptureUser = {...user,id:"owner-two"};
const request = (headers: Record<string,string>,method = "GET") => new Request("http://localhost:3003/api/recordings",{method,headers});

test("session credentials, extension scope, CSRF, and revocation",async () => {
  const token = await createSession(user);
  const cookie = `accord_session=${token}`;
  assert.equal((await requestUser(request({cookie})))?.id,user.id);
  await assert.rejects(requireUser(request({cookie,origin:"https://other.invalid"},"POST")),/Open this action/);
  await assert.rejects(requireUser(request({cookie,authorization:"invalid"},"POST")),/Open this action/);
  const paired = await extensionToken(user);
  assert.equal(await requestUser(request({authorization:`Bearer ${paired.token}`})),null,"Extension tokens cannot open private pages or state routes");
  assert.equal((await requireUser(request({authorization:`Bearer ${paired.token}`},"POST"),true)).id,user.id);
  await revokeExtensions(user);
  assert.equal(await requestUser(request({authorization:`Bearer ${paired.token}`}),true),null);
  assert.equal(await requestUser(request({cookie:"accord_session=not-a-real-token"})),null);
});
test("OAuth state expires and encrypted credentials reject tampering",async () => {
  const transaction = await encrypt({state:"expected",nonce:"nonce",verifier:"verifier",expiresAt:Date.now()+60000});
  assert.equal((await decrypt<{state:string}>(transaction)).state,"expected");
  await assert.rejects(completeGoogleAuth("http://localhost:3003","code","different",transaction),/sign-in request expired/);
  await assert.rejects(completeGoogleAuth("http://localhost:3003","code","expected",await encrypt({state:"expected",expiresAt:0})),/sign-in request expired/);
  const [iv,tag,data] = transaction.split('.');
  await assert.rejects(decrypt(`${iv}.${tag}.${data.slice(0,-3)}abc`));
});
test("calendar accepts Meet calls and rejects cancelled, malformed, and other links",() => {
  assert.equal(meetAddress("https://meet.google.com/abc-defg-hij?authuser=0"),"https://meet.google.com/abc-defg-hij");
  assert.equal(meetAddress("https://meet.google.com.evil.invalid/abc-defg-hij"),null);
  assert.equal(meetAddress("http://meet.google.com/abc-defg-hij"),null);
  const event = {id:"event",summary:"Meeting",hangoutLink:"https://meet.google.com/abc-defg-hij",start:{dateTime:"2026-10-07T10:00:00Z"},end:{dateTime:"2026-10-07T11:00:00Z"}};
  assert.equal(calendarEvents([event,{...event,id:"cancelled",status:"cancelled"},{...event,id:"bad",start:{dateTime:"bad"}},{...event,id:"zoom",hangoutLink:"https://zoom.us/123"}]).length,1);
});
test("transcript keeps neutral voices and rejects unsafe or unordered time ranges",() => {
  const transcript = validateTranscript({segments:[{speaker:"S7",startSeconds:0,endSeconds:2,text:"Sarah says the checklist is due."},{speaker:"S2",startSeconds:2,endSeconds:4,text:"Agreed."}]},4,"rec-test");
  assert.equal(transcript[0].speakerLabel,"Speaker 1"); assert.equal(transcript[1].speakerLabel,"Speaker 2");
  assert.throws(() => validateTranscript({segments:[{speaker:"Sarah",startSeconds:0,endSeconds:2,text:"Hello"}]},4,"rec-test"));
  assert.throws(() => validateTranscript({segments:[{speaker:"S1",startSeconds:4.1,endSeconds:4.4,text:"Hello"}]},4,"rec-test"));
  assert.throws(() => validateTranscript({segments:[{speaker:"S1",startSeconds:0,endSeconds:Infinity,text:"Hello"}]},4,"rec-test"));
  assert.deepEqual(validateTranscript({segments:[]},4,"rec-test"),[]);
});
test("media range requests support seek, suffix, and invalid range replies",async () => {
  const bytes = Buffer.from("abcdefghij");
  const response = audioResponse(bytes,request({range:"bytes=2-5"}),"audio/webm");
  assert.equal(response.status,206); assert.equal(await response.text(),"cdef"); assert.equal(response.headers.get("Content-Range"),"bytes 2-5/10");
  assert.equal(await audioResponse(bytes,request({range:"bytes=-3"}),"audio/webm").text(),"hij");
  assert.equal(audioResponse(bytes,request({range:"bytes=50-60"}),"audio/webm").status,416);
  assert.equal(audioResponse(bytes,request({range:"bytes=0-1,4-5"}),"audio/webm").status,416);
});
test("upload survives retries, verifies every part, and protects account ownership",async () => {
  const capture = await startCapture(user,{title:"Upload recovery",meetUrl:"https://meet.google.com/abc-defg-hij"});
  await assert.rejects(ownedCapture(other,capture.id),/Recording not found/);
  await uploadChunk(user,capture.id,0,Buffer.from("first"));
  assert.equal((await uploadChunk(user,capture.id,0,Buffer.from("first"))).duplicate,true);
  await assert.rejects(uploadChunk(user,capture.id,0,Buffer.from("changed")),/different audio/);
  await assert.rejects(finishCapture(user,capture.id,{chunkCount:2,durationSeconds:2}),/Some audio parts/);
  await uploadChunk(user,capture.id,1,Buffer.from("second"));
  const finished = await finishCapture(user,capture.id,{chunkCount:2,durationSeconds:2,markers:[{seconds:1,label:"Useful point"},{seconds:100,label:"Out of range"}]});
  assert.equal(finished.status,"queued"); assert.equal(finished.markers.length,1); assert.equal((await assembleAudio(finished)).toString(),"firstsecond");
  assert.equal((await finishCapture(user,capture.id,{chunkCount:2,durationSeconds:2})).status,"queued");
  await assert.rejects(uploadChunk(user,capture.id,2,Buffer.from("late")),/already saved/);
  await assert.rejects(uploadChunk(user,capture.id,900,Buffer.from("late")),/Invalid recording part/);
});
test("processing locks reject a second claim and release after failure",async () => {
  await assert.rejects(withLock("lock-test",async () => withLock("lock-test",async () => true)),/busy/);
  assert.equal(await withLock("lock-test",async () => true),true);
});
test("recording edits reject corrupt notes, task states, duplicate moments, and unsafe audio ranges", () => {
  const moment = {id:"moment",meetingId:"rec-test",meetingTitle:"Test",label:"Point",startSeconds:1,endSeconds:3,createdAt:new Date().toISOString(),shared:false};
  const state = {actionOverrides:{action:{completed:true,reviewState:"accepted"}},insightOverrides:{},moments:[moment],summaryTemplate:"overview",summaryDrafts:{},aiDraft:null};
  assert.equal(validReview(state,"rec-test",5).actionOverrides.action.completed,true);
  for (const invalid of [
    {...state,actionOverrides:{action:{completed:"true"}}},
    {...state,insightOverrides:{point:{reviewState:"unknown"}}},
    {...state,summaryDrafts:{overview:{format:"overview",insights:[null]}}},
    {...state,moments:[moment,moment]},
    {...state,moments:[{...moment,endSeconds:6}]},
    {...state,aiDraft:{actions:"invalid"}},
  ]) assert.throws(() => validReview(invalid,"rec-test",5));
});
test("audio normalization removes a pause gap from the recording timeline",async () => {
  assert.ok(ffmpeg);
  const input = path.join(directory,"pause-gap.webm");
  const output = path.join(directory,"pause-normalized.webm");
  await promisify(execFile)(process.env.FFMPEG_PATH || ffmpeg!,["-y","-f","lavfi","-i","sine=frequency=440:duration=2","-af","asetpts=PTS+gte(T\\,1)*5/TB","-c:a","libopus",input]);
  assert.ok(await audioDuration(input) > 6,"The source must contain a real timestamp gap");
  await normalizeAudio(input,output);
  assert.ok(Math.abs(await audioDuration(output)-2) < 0.05,"Saved moment times must use the audio timeline without paused time");
});
test("private meeting counts follow saved reviews, summary selection, and regenerated tasks",async () => {
  const capture = await startCapture(user,{title:"Saved review count",meetUrl:"https://meet.google.com/abc-defg-hij"});
  const note = {kind:"fact",title:"Useful point",detail:null,previousValue:null,currentValue:null,sourceSegmentId:null,sourceNote:"Test note"};
  const outcome = {format:"overview",generatedAt:"2026-10-07T00:00:00Z",model:"test",insights:[note]};
  const brief = {...outcome,format:"project-update",insights:[note,note]};
  let reviewState = validReview({actionOverrides:{},insightOverrides:{},moments:[],summaryTemplate:"overview",summaryDrafts:{overview:outcome,"project-update":brief},aiDraft:null},capture.id,6);
  const record = {id:capture.id,title:capture.title,recordedDate:"7 October 2026",durationSeconds:6,transcript:[],actions:[{id:"original-task",reviewState:"needs-review"}],insights:[],speakers:[]} as unknown as MeetingRecord;
  const count = async () => {
    await writeDocument("capture",capture.id,user.id,{...capture,status:"ready",record,reviewState});
    return (await meetingCatalog(user)).find((meeting) => meeting.id === capture.id)!.reviewCount;
  };
  assert.equal(await count(),2);
  reviewState = {...reviewState,actionOverrides:{"original-task":{reviewState:"accepted"}},insightOverrides:{[aiSummaryInsightId(capture.id,reviewState.summaryDrafts.overview!,0)]:{reviewState:"dismissed"}}};
  assert.equal(await count(),0,"Accepted or dismissed notes must leave the pending count");
  reviewState = {...reviewState,summaryTemplate:"project-update"};
  assert.equal(await count(),2,"Only the selected saved summary contributes notes");
  const regenerated = {generatedAt:"2026-10-07T00:01:00Z",model:"test",summary:[],actions:[{title:"New task",owner:null,due:null,condition:null,recipient:null,sourceSegmentId:null,sourceNote:"Test task"}]};
  reviewState = {...reviewState,aiDraft:regenerated};
  assert.equal(await count(),3,"A task refresh replaces the old task revision");
  reviewState.actionOverrides[aiActionId(capture.id,regenerated,0)] = {reviewState:"accepted"};
  assert.equal(await count(),2);
  assert.equal((await meetingCatalog(other)).some((meeting) => meeting.id === capture.id),false);
});
test("shared audio is cropped, private source is not exposed, and an edit revokes the link",async () => {
  assert.ok(ffmpeg);
  const input = path.join(directory,"tone.webm");
  await promisify(execFile)(process.env.FFMPEG_PATH || ffmpeg!,["-y","-f","lavfi","-i","sine=frequency=440:duration=6","-c:a","libopus",input]);
  const normalized = path.join(directory,"normalized.webm"); await normalizeAudio(input,normalized);
  const capture = await startCapture(user,{title:"Clip privacy",meetUrl:"https://meet.google.com/abc-defg-hij"});
  await uploadChunk(user,capture.id,0,await readFile(normalized));
  const finished = await finishCapture(user,capture.id,{chunkCount:1,durationSeconds:6});
  const moment = {id:"moment",meetingId:capture.id,meetingTitle:capture.title,label:"Selected audio",startSeconds:2,endSeconds:4,createdAt:new Date().toISOString(),shared:false};
  const reviewState = validReview({actionOverrides:{},insightOverrides:{},moments:[moment],summaryDrafts:{},summaryTemplate:"overview",aiDraft:null},capture.id,6);
  const record = {id:capture.id,title:capture.title,recordedDate:"7 October 2026",durationSeconds:6,transcript:[],actions:[],insights:[],speakers:[]} as unknown as MeetingRecord;
  const ready: CaptureSession = {...finished,status:"ready",record,reviewState,audioPath:(await readDocument<{path:string}>("chunk",`${capture.id}-0`))!.data.path};
  await writeDocument("capture",capture.id,user.id,ready);
  assert.equal(await accessibleMeeting(capture.id,null),null); assert.equal(await accessibleMeeting(capture.id,other),null);
  assert.equal((await accessibleMeeting(capture.id,user))?.id,capture.id);
  const sharePath = await createShare(ready,moment); const token = sharePath.split('/').pop()!;
  const shared = await sharedAudio(token); assert.ok(shared); assert.equal(shared.duration,2);
  const clipFile = path.join(directory,"cropped.webm"); const {writeFile} = await import("node:fs/promises");
  await writeFile(clipFile,await loadBlob(shared.audioPath));
  assert.ok(Math.abs(await audioDuration(clipFile)-2)<.15,"Only the selected two seconds are in the shared file");
  await invalidateShares(ready,[{...moment,endSeconds:5}]); assert.equal(await sharedAudio(token),null);
  assert.equal(await sharedAudio(opaqueToken()),null);
});
