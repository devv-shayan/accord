import { api, connection, json } from './api.js';
import { allSessions, getSession, putSession, partsFor, removeSession } from './database.js';

const meetUrl = value => typeof value === 'string' && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[?#].*)?$/.test(value);
let offscreenOpening;
async function offscreen() {
  if (!(await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length) {
    offscreenOpening ||= chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Record Meet tab audio and microphone audio while the popup is closed.' }).finally(() => { offscreenOpening = undefined; });
    await offscreenOpening;
  }
}
async function recordingCommand(message) {
  await offscreen();
  return chrome.runtime.sendMessage({ ...message, target: 'recorder' });
}
async function notify(id, title, message) {
  await chrome.notifications.create(id, { type: 'basic', iconUrl: 'icon.png', title, message });
}
async function start(tabId, includeMic) {
  const tab = await chrome.tabs.get(tabId);
  if (!meetUrl(tab.url)) throw new Error('Open and join a Google Meet call first.');
  const info = await chrome.tabs.sendMessage(tabId, { type: 'meet-info' }).catch(() => null);
  if (!info?.joined) throw new Error('Join the call before you start recording. Reload Meet if the extension was just installed.');
  await connection();
  const { capture } = await chrome.storage.local.get('capture');
  if (capture && ['recording', 'paused', 'starting', 'saving'].includes(capture.status)) throw new Error('Finish the current recording first.');
  // The popup is an extension invocation. Get the stream ID before any server work.
  await offscreen();
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  return recordingCommand({ type: 'start', streamId, tabId, includeMic, info, meetUrl: tab.url.split(/[?#]/)[0] });
}
async function recover(key) {
  const session = await getSession(key);
  if (!session) throw new Error('The local recording was not found.');
  if (['recording','paused','starting','saving'].includes(session.status)) {
    const { capture } = await chrome.storage.local.get('capture');
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (capture?.key === key && contexts.length && ['recording','paused','starting'].includes(capture.status)) throw new Error('Stop this recording before you retry the upload.');
  }
  const parts = await partsFor(key);
  if (!parts.length) throw new Error('This recording has no saved audio parts.');
  const linked = await connection();
  if (linked.origin !== session.origin) throw new Error('Connect to the original Accord site to retry this upload.');
  if (!session.id) session.id = (await api('/api/recordings', json('POST', { title: session.title, meetUrl: session.meetUrl, mimeType: session.mimeType }), session.origin)).capture.id;
  session.status = 'saving';
  await putSession(session);
  for (const part of parts) await api(`/api/recordings/${session.id}/chunks/${part.index}`, { method: 'PUT', headers: { 'Content-Type': session.mimeType }, body: part.blob }, session.origin);
  await api(`/api/recordings/${session.id}/finish`, json('POST', { chunkCount: parts.length, durationSeconds: Math.max(.5, session.durationSeconds), markers: session.markers, participants: session.participants }), session.origin);
  session.status = 'uploaded'; session.error = undefined;
  await putSession(session);
  await chrome.storage.local.set({ capture: { ...session, status: 'uploaded' } });
  return { session };
}
async function status() {
  const { connection: linked, capture } = await chrome.storage.local.get(['connection','capture']);
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  const sessions = (await allSessions()).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const active = contexts.length && capture && ['recording','paused','starting','saving'].includes(capture.status) ? capture : null;
  return { connection: linked ? { origin: linked.origin, name: linked.name, expiresAt: linked.expiresAt } : null, active,
    sessions: sessions.map(({ key, title, id, status, createdAt, durationSeconds, origin, error }) => ({ key, title, id, status, createdAt, durationSeconds, origin, error })) };
}
chrome.runtime.onMessageExternal.addListener((message, sender, reply) => {
  const senderOrigin = sender.url && new URL(sender.url).origin;
  if (!senderOrigin) { reply({ error: 'Open Accord to connect.' }); return; }
  if (message?.type === 'ping') { reply({ installed: true }); return; }
  if (message?.type !== 'pair' || message.origin !== senderOrigin || !/^[A-Za-z0-9_-]{43}$/.test(message.token) || !Number.isFinite(message.expiresAt)) { reply({ error: 'Invalid connection request.' }); return; }
  if (new URL(senderOrigin).protocol !== 'https:' && !['localhost','127.0.0.1'].includes(new URL(senderOrigin).hostname)) { reply({ error: 'Use HTTPS to connect Accord.' }); return; }
  // The visible confirmation page requests host permission for this exact origin only.
  chrome.storage.session.set({ pendingConnection: { origin: senderOrigin, token: message.token, expiresAt: message.expiresAt } })
    .then(() => chrome.tabs.create({ url: chrome.runtime.getURL('connect.html') })).then(() => reply({ pending: true })).catch(() => reply({ error: 'The connection page could not open.' }));
  return true;
});
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.target === 'recorder' || message?.target === 'meet') return;
  const extensionPage = sender.url?.startsWith(chrome.runtime.getURL(''));
  const fromMeet = sender.tab && meetUrl(sender.tab.url);
  const run = async () => {
    if (extensionPage) {
      switch (message.type) {
        case 'recorder-connection': return { connection: await connection() };
        case 'recorder-state': await chrome.storage.local.set({ capture: message.capture }); return { saved: true };
        case 'recorder-notify': await notify('recording-saved',message.title,message.message); return { notified: true };
        case 'status': return status();
        case 'start': return start(message.tabId, message.includeMic);
        case 'pause': case 'resume': case 'stop': case 'mark': case 'microphone': return recordingCommand(message);
        case 'retry': return recover(message.key);
        case 'clear': {
          const current = await status();
          if (current.active?.key === message.key) throw new Error('Stop the recording before you remove its audio.');
          await removeSession(message.key); return { removed: true };
        }
        case 'disconnect': await chrome.storage.local.remove('connection'); return { disconnected: true };
      }
    }
    if (fromMeet) {
      if (message.type === 'joined') {
        const linked = await connection().catch(() => null);
        if (linked) await notify(`meet:${sender.tab.id}`, 'Accord can record this call', 'Click Accord in the Chrome toolbar to start.');
        return { connected: !!linked };
      }
      if (message.type === 'left') {
        const { capture } = await chrome.storage.local.get('capture');
        if (capture?.tabId === sender.tab.id && ['recording','paused'].includes(capture.status)) return recordingCommand({ type: 'stop' });
      }
      if (message.type === 'status') return status().then(({ active }) => ({ active: active?.tabId === sender.tab.id ? active : null }));
      if (['pause','resume','stop','mark','microphone'].includes(message.type)) {
        const { capture } = await chrome.storage.local.get('capture');
        if (capture?.tabId !== sender.tab.id) throw new Error('There is no Accord recording in this call.');
        return recordingCommand(message);
      }
    }
    throw new Error('This control is not available.');
  };
  run().then(reply).catch(error => reply({ error: error.message }));
  return true;
});
chrome.notifications.onClicked.addListener(id => {
  if (id.startsWith('meet:')) chrome.tabs.update(Number(id.slice(5)), { active: true }).catch(() => undefined);
});
const stopForTab = async tabId => {
  const { capture } = await chrome.storage.local.get('capture');
  if (capture?.tabId === tabId && ['recording','paused'].includes(capture.status)) await recordingCommand({ type: 'stop' }).catch(() => undefined);
};
chrome.tabs.onRemoved.addListener(stopForTab);
chrome.tabs.onUpdated.addListener((tabId, change) => { if (change.url && !meetUrl(change.url)) void stopForTab(tabId); });
chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('calendar', { periodInMinutes: 5 }));
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('calendar', { periodInMinutes: 5 }));
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== 'calendar') return;
  const linked = await connection().catch(() => null);
  if (!linked) return;
  try { const result = await api('/api/calendar'); await chrome.storage.local.set({ upcoming: result.meetings || [] }); }
  catch { /* Local recording remains available when Calendar is not connected. */ }
});
