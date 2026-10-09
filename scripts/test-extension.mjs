import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate as tick } from 'node:timers/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const origin = 'http://localhost:3003';
const extensionUrl = 'chrome-extension://lkmlbnfmhpmbefplinaifgbdggkmceci/';
async function source(name) {
  return (await readFile(new URL(`../extension/accord-meet/${name}`, import.meta.url), 'utf8'))
    .replace(/^import .+;\n/gm, '').replace(/^export /gm, '');
}
test('offscreen API uses runtime only and binds every request to the connected site', async () => {
  const calls = [];
  const context = vm.createContext({ AbortSignal, Date, chrome: { runtime: { sendMessage: async message => {
    calls.push(message); return { connection: { origin, token: 'limited-token', expiresAt: Date.now() + 60_000 } };
  } } }, fetch: async (url, options) => {
    calls.push({ url, options }); return { ok: true, json: async () => ({ saved: true }) };
  } });
  vm.runInContext(`${await source('api.js')}\nthis.testApi = api;`, context);
  assert.equal((await context.testApi('/api/recordings', {}, origin)).saved, true);
  assert.equal(calls[0].type, 'recorder-connection');
  assert.equal(calls[1].options.credentials, 'omit');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer limited-token');
  await assert.rejects(context.testApi('/api/recordings', {}, 'https://other.invalid'), /same Accord site/);
  assert.equal(calls.filter(call => call.url).length, 1, 'No request can go to a substituted site');
});

test('offline recording preserves audio and markers, excludes pause time, and retries durable parts', async () => {
  let now = 1_000, offline = true, handler, workerHandler, audioContextClosed = false;
  const sessions = new Map(), parts = [], connections = [], streams = [], calls = [];
  const storage = { connection: { origin, expiresAt: Date.now() + 60_000 } };
  const getSession = async key => structuredClone(sessions.get(key));
  const putSession = async session => sessions.set(session.key, structuredClone(session));
  const partsFor = async key => parts.filter(part => part.session === key);
  const json = (method, body) => ({ method, body: JSON.stringify(body) });
  const api = async (path, options = {}, expectedOrigin) => {
    assert.ok(!expectedOrigin || expectedOrigin === origin);
    calls.push({ path, options });
    if (path === '/api/recordings' && calls.length === 1) assert.equal(mediaRecorder.state, 'recording', 'Audio starts before network setup');
    if (offline) throw new Error('Offline');
    if (path === '/api/recordings') return { capture: { id: 'rec-recovered' } };
    if (path.includes('/chunks/')) assert.ok(parts.length, 'Audio is durable before upload');
    return { saved: true };
  };
  function stream() {
    const track = { enabled: true, stopped: false, stop() { this.stopped = true; }, addEventListener() {} };
    const result = { getTracks: () => [track], getAudioTracks: () => [track] }; streams.push(result); return result;
  }
  class AudioContext {
    destination = { name: 'speakers' };
    async resume() {}
    async close() { audioContextClosed = true; }
    createMediaStreamDestination() { return { name: 'recording', stream: stream() }; }
    createMediaStreamSource(input) { return { connect: target => connections.push({ input, target }) }; }
  }
  let mediaRecorder;
  class MediaRecorder {
    state = 'inactive'; listeners = new Map();
    static isTypeSupported() { return true; }
    // The harness needs the recorder created by the real offscreen module.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    constructor() { mediaRecorder = this; }
    start() { this.state = 'recording'; }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    emit(data) { this.ondataavailable({ data: new Blob([data]) }); }
    stop() { this.state = 'inactive'; this.emit('last audio'); queueMicrotask(() => this.listeners.get('stop')()); }
  }
  const runtime = {
    getURL: file => extensionUrl + file,
    onMessage: { addListener: fn => { handler = fn; } },
    sendMessage: async message => {
      if (message.type === 'recorder-state') storage.capture = structuredClone(message.capture);
      return { saved: true };
    },
  };
  const context = vm.createContext({ console, Blob, Date, Error, crypto: { randomUUID: () => 'local-session' },
    performance: { now: () => now }, AudioContext, MediaRecorder, queueMicrotask,
    setInterval: () => 1, clearInterval() {}, chrome: { runtime },
    navigator: { mediaDevices: { getUserMedia: async () => stream() } },
    api, json, connection: async () => storage.connection, putSession, partsFor,
    putPart: async (session, index, blob) => parts.push({ session, index, blob }),
  });
  vm.runInContext(await source('offscreen.js'), context);
  const command = message => new Promise(resolve => handler({ target: 'recorder', ...message }, { url: extensionUrl + 'worker.js' }, resolve));
  assert.equal((await command({ type: 'start', includeMic: true, streamId: 'approved-tab', tabId: 1,
    info: { title: 'Offline test' }, meetUrl: 'https://meet.google.com/abc-defg-hij' })).started, true);
  await tick();
  assert.equal(storage.capture.status, 'recording');
  assert.match(storage.capture.error, /Offline/);
  const micInput = streams[2];
  assert.ok(connections.some(item => item.input === streams[0] && item.target.name === 'speakers'));
  assert.ok(connections.some(item => item.input === micInput && item.target.name === 'recording'));
  assert.ok(!connections.some(item => item.input === micInput && item.target.name === 'speakers'), 'Microphone must not feed back through speakers');
  now = 11_000; mediaRecorder.emit('opening words'); await tick();
  await command({ type: 'pause' });
  now = 61_000; await command({ type: 'mark' });
  assert.equal(storage.capture.markers[0].seconds, 10, 'Paused time cannot move a marked moment');
  await command({ type: 'resume' }); now = 66_000;
  await command({ type: 'stop' });
  assert.equal(storage.capture.status, 'interrupted');
  assert.equal(storage.capture.durationSeconds, 15);
  assert.equal(parts.length, 2); assert.equal(await parts[0].blob.text(), 'opening words');
  assert.ok([streams[0], micInput].every(item => item.getTracks().every(track => track.stopped)), 'Stop releases tab and microphone devices');
  assert.equal(audioContextClosed, true);
  offline = false;
  const event = { addListener() {} };
  const workerChrome = {
    runtime: { getURL: runtime.getURL, getContexts: async () => [], onMessage: { addListener: fn => { workerHandler = fn; } },
      onMessageExternal: event, onInstalled: event, onStartup: event },
    storage: { local: { get: async () => storage, set: async changes => Object.assign(storage, changes) } },
    tabs: { onRemoved: event, onUpdated: event }, notifications: { onClicked: event }, alarms: { onAlarm: event },
  };
  vm.runInContext(await source('worker.js'), vm.createContext({ console, URL, Date, Error, api, json,
    connection: async () => storage.connection, allSessions: async () => [...sessions.values()], getSession, putSession, partsFor,
    removeSession() {}, chrome: workerChrome }));
  const recovered = await new Promise(resolve => workerHandler({ type: 'retry', key: 'local-session' }, { url: extensionUrl + 'popup.html' }, resolve));
  assert.equal(recovered.session.status, 'uploaded');
  const finished = JSON.parse(calls.find(call => call.path.endsWith('/finish')).options.body);
  assert.equal(finished.chunkCount, 2); assert.equal(finished.durationSeconds, 15); assert.equal(finished.markers[0].seconds, 10);
  assert.equal(calls.filter(call => call.path.includes('/chunks/')).length, 2);
  assert.equal(parts.length, 2, 'Upload success keeps the local copy until the user removes it');
});
