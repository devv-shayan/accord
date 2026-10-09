import { api, connection, json } from './api.js';
import { putSession, putPart, partsFor } from './database.js';

let recording, recorder, context, tabStream, micStream, micSource, destination, elapsed = 0, runningSince = 0, timer;
let writes = Promise.resolve(), uploads = Promise.resolve(), initialUpload = Promise.resolve(), uploading = false, stopping = false;
const clock = () => elapsed + (runningSince ? (performance.now() - runningSince) / 1000 : 0);
const live = async () => {
  if (!recording) return;
  recording.durationSeconds = clock();
  await putSession(recording);
  const result = await chrome.runtime.sendMessage({ type: 'recorder-state', capture: { ...recording } });
  if (result?.error) throw new Error(result.error);
};
function release() {
  clearInterval(timer);
  for (const stream of [tabStream, micStream]) stream?.getTracks().forEach(track => track.stop());
  void context?.close(); tabStream = micStream = micSource = context = destination = null;
}
async function mic(enabled) {
  if (enabled && !micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    micSource = context.createMediaStreamSource(micStream); micSource.connect(destination);
  }
  micStream?.getAudioTracks().forEach(track => { track.enabled = enabled; });
  recording.microphone = enabled; await live();
}
async function syncParts() {
  if (uploading || !recording?.id) return;
  uploading = true;
  try {
    const parts = await partsFor(recording.key);
    for (const part of parts) {
      if (part.index < recording.uploadedParts) continue;
      await api(`/api/recordings/${recording.id}/chunks/${part.index}`, { method: 'PUT', headers: { 'Content-Type': recording.mimeType }, body: part.blob }, recording.origin);
      recording.uploadedParts = part.index + 1; recording.error = undefined;
      await live();
    }
  } catch (error) { recording.error = `${error.message} Audio is kept on this device.`; await live(); }
  finally { uploading = false; }
}
async function start(message) {
  if (recorder?.state && recorder.state !== 'inactive') throw new Error('A recording is already in progress.');
  const linked = await connection();
  const mimeType = 'audio/webm;codecs=opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('This Chrome version cannot record this audio format.');
  tabStream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: message.streamId } }, video: false });
  context = new AudioContext(); await context.resume();
  destination = context.createMediaStreamDestination();
  const source = context.createMediaStreamSource(tabStream);
  source.connect(context.destination); // Keep Meet audible. The microphone is never sent to the speakers.
  source.connect(destination);
  elapsed = 0; runningSince = 0; stopping = false; writes = Promise.resolve(); uploads = Promise.resolve();
  recording = { key: crypto.randomUUID(), id: null, origin: linked.origin, tabId: message.tabId,
    title: message.info.title || 'Google Meet', meetUrl: message.meetUrl, mimeType,
    participants: message.info.participants || [], markers: [], status: 'starting', uploadedParts: 0, chunkCount: 0,
    microphone: false, durationSeconds: 0, createdAt: new Date().toISOString() };
  try {
    if (message.includeMic) await mic(true);
    recorder = new MediaRecorder(destination.stream, { mimeType, audioBitsPerSecond: 64000 });
    recorder.ondataavailable = event => {
      if (!event.data.size) return;
      writes = writes.then(async () => {
        const index = recording.chunkCount;
        await putPart(recording.key, index, event.data);
        recording.chunkCount = index + 1; await live();
        uploads = uploads.then(syncParts);
      }).catch(async error => {
        recording.error = 'Device storage could not save the audio. Stop recording and download the saved parts.';
        console.error('Accord local recording storage failed', error.name);
        if (!stopping) void stop();
      });
    };
    recorder.onerror = () => { recording.error = 'The browser stopped recording. Saved audio can be recovered.'; void stop(); };
    tabStream.getAudioTracks().forEach(track => track.addEventListener('ended', () => { if (!stopping) void stop(); }));
    recorder.start(10_000); runningSince = performance.now(); recording.status = 'recording'; await live();
    // Capture starts before the network request. Offline calls do not lose their opening words.
    initialUpload = (async () => {
      try { recording.id = (await api('/api/recordings', json('POST', { title: recording.title, meetUrl: recording.meetUrl, mimeType }))).capture.id; }
      catch (error) { recording.error = `${error.message} Audio will stay on this device.`; }
      await live();
    })();
    timer = setInterval(() => { void live().catch(() => undefined); uploads = uploads.then(syncParts); if (clock() >= 7200) void stop(); }, 5000);
    return { started: true };
  } catch (error) { release(); recording.status = 'interrupted'; recording.error = error.message; await live(); throw error; }
}
async function stop() {
  if (stopping || !recorder || recorder.state === 'inactive') return { stopped: true };
  stopping = true;
  elapsed = clock(); runningSince = 0;
  clearInterval(timer);
  recording.status = 'saving';
  await new Promise(resolve => { recorder.addEventListener('stop', resolve, { once: true }); recorder.stop(); });
  release();
  await writes;
  await initialUpload;
  await uploads;
  await live();
  try {
    const parts = await partsFor(recording.key);
    if (!parts.length) throw new Error('No audio was saved.');
    if (!recording.id) recording.id = (await api('/api/recordings', json('POST', { title: recording.title, meetUrl: recording.meetUrl, mimeType: recording.mimeType }), recording.origin)).capture.id;
    await syncParts();
    if (recording.uploadedParts !== parts.length) throw new Error('Some audio parts still need to upload.');
    await api(`/api/recordings/${recording.id}/finish`, json('POST', { chunkCount: parts.length, durationSeconds: Math.max(.5, elapsed), markers: recording.markers, participants: recording.participants }), recording.origin);
    recording.status = 'uploaded'; recording.error = undefined;
  } catch (error) { recording.status = 'interrupted'; recording.error = `${error.message} Select Retry in the extension. Audio is kept on this device.`; }
  await live();
  await chrome.runtime.sendMessage({ type: 'recorder-notify', title: recording.status === 'uploaded' ? 'Accord has your recording' : 'Accord kept the audio on this device', message: recording.status === 'uploaded' ? 'Open Accord to check the transcript and notes.' : 'Open the extension to retry or download the recording.' });
  return { stopped: true, id: recording.id };
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.target !== 'recorder' || !sender.url?.startsWith(chrome.runtime.getURL(''))) return;
  const run = async () => {
    if (message.type === 'start') return start(message);
    if (!recording) throw new Error('There is no active recording.');
    if (message.type === 'stop') return stop();
    if (message.type === 'pause' && recorder.state === 'recording') { elapsed = clock(); runningSince = 0; recorder.pause(); recording.status = 'paused'; }
    else if (message.type === 'resume' && recorder.state === 'paused') { recorder.resume(); runningSince = performance.now(); recording.status = 'recording'; }
    else if (message.type === 'mark') recording.markers.push({ seconds: clock(), label: `Marked moment ${recording.markers.length + 1}` });
    else if (message.type === 'microphone') return mic(!!message.enabled).then(() => ({ changed: true }));
    await live(); return { changed: true };
  };
  run().then(reply).catch(error => reply({ error: error.message })); return true;
});
