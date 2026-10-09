import { getSession, partsFor } from './database.js';
const $ = id => document.getElementById(id);
let active, activeTab, lastSessions = '', microphonePermission;
const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;
async function send(type, body = {}) {
  const result = await chrome.runtime.sendMessage({ type, ...body });
  if (result?.error) throw new Error(result.error);
  return result;
}
async function action(button, work) {
  button.disabled = true; $('message').textContent = ''; $('message').className = '';
  try { await work(); await refresh(); }
  catch (error) { $('message').textContent = error.message; $('message').className = 'error'; }
  finally { button.disabled = button.id === 'start' && !isMeetTab(); }
}
function isMeetTab() { return activeTab?.url?.startsWith('https://meet.google.com/'); }
function updateMicrophonePermission() {
  $('enable-mic').hidden = !$('include-mic').checked || microphonePermission?.state === 'granted';
}
function addButton(parent, label, work) {
  const button = document.createElement('button'); button.textContent = label;
  button.addEventListener('click', () => action(button, work)); parent.append(button);
}
async function download(key) {
  const [session,parts] = await Promise.all([getSession(key), partsFor(key)]);
  if (!parts.length) throw new Error('No audio parts were saved.');
  const url = URL.createObjectURL(new Blob(parts.map(part => part.blob), { type: session.mimeType }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${session.title.replace(/[^\w -]/g,'').slice(0,80) || 'Accord recording'}.webm`;
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url),60_000);
}
async function refresh() {
  const state = await send('status'); active = state.active;
  $('account').textContent = state.connection ? `${state.connection.name || 'Connected'} · ${new URL(state.connection.origin).host}` : 'Connect to Accord to start.';
  $('connection-status').textContent = state.connection ? 'Connected' : 'Not connected';
  $('connection-status').classList.toggle('connected',!!state.connection);
  $('setup').hidden = !!state.connection; $('ready').hidden = !state.connection || !!active; $('active').hidden = !active;
  $('open').hidden = !state.connection; $('connection').hidden = !state.connection;
  if (state.connection) $('open').href = `${state.connection.origin}/record`;
  if (active) {
    $('active-title').textContent = active.title; $('active-time').textContent = time(active.durationSeconds); $('active-status').textContent = active.status === 'saving' ? 'Saving the audio…' : active.status === 'paused' ? 'Recording is paused' : 'Recording';
    $('pause').textContent = active.status === 'paused' ? 'Resume' : 'Pause'; $('mic').checked = active.microphone;
    for (const name of ['pause','mark','stop','mic']) $(name).disabled = ['saving','starting'].includes(active.status);
    if (active.error) $('message').textContent = active.error;
  }
  const nextSessions = JSON.stringify(state.sessions.map(session => ({ ...session, durationSeconds: Math.floor(session.durationSeconds / 10) })));
  if (nextSessions === lastSessions) return;
  lastSessions = nextSessions; $('sessions').replaceChildren();
  $('recordings').hidden = !state.sessions.length;
  const pending = state.sessions.filter(session => session.status !== 'uploaded' && active?.key !== session.key).length;
  $('recordings-label').textContent = pending ? `Saved recordings · ${pending} to upload` : `Saved recordings · ${state.sessions.length}`;
  $('recordings-label').classList.toggle('upload-needed',pending > 0);
  if (!state.sessions.length) { const p = document.createElement('p'); p.textContent = 'No recordings yet.'; $('sessions').append(p); }
  for (const session of state.sessions) {
    const card = document.createElement('div'); card.className = 'card';
    const heading = document.createElement('p'); heading.textContent = `${session.title} · ${time(session.durationSeconds)}`; card.append(heading);
    const text = document.createElement('p'); text.className = 'muted'; text.textContent = active?.key === session.key ? 'In progress' : session.status === 'uploaded' ? 'Uploaded to Accord' : 'Audio on this device · upload needed'; card.append(text);
    const nav = document.createElement('nav');
    if (active?.key !== session.key) {
      if (session.status !== 'uploaded') addButton(nav,'Retry upload',() => send('retry',{key:session.key}));
      addButton(nav,'Download audio',() => download(session.key));
      if (session.status === 'uploaded' && session.id) { const link = document.createElement('a'); link.href = `${session.origin}/record`; link.target = '_blank'; link.className = 'button'; link.textContent = 'View progress'; nav.append(link); }
      addButton(nav,'Remove local copy',async () => { if (confirm('Remove this recording from this device? This cannot be undone.')) { await send('clear',{key:session.key}); lastSessions = ''; } });
    }
    card.append(nav); $('sessions').append(card);
  }
}
$('start').addEventListener('click',() => action($('start'),async () => {
  if (!activeTab) throw new Error('Open a Google Meet call first.');
  await send('start',{tabId:activeTab.id,includeMic:$('include-mic').checked});
}));
$('pause').addEventListener('click',() => action($('pause'),() => send(active?.status === 'paused' ? 'resume' : 'pause')));
$('mark').addEventListener('click',() => action($('mark'),async () => { await send('mark'); $('message').textContent = 'Moment marked.'; }));
$('stop').addEventListener('click',() => action($('stop'),() => send('stop')));
$('mic').addEventListener('change',() => action($('mic'),() => send('microphone',{enabled:$('mic').checked})));
$('disconnect').addEventListener('click',() => action($('disconnect'),async () => { if (active) throw new Error('Stop recording before you disconnect.'); await send('disconnect'); }));
[activeTab] = await chrome.tabs.query({active:true,currentWindow:true});
if (isMeetTab()) $('call').textContent = activeTab.title || 'Google Meet';
$('start').disabled = !isMeetTab();
$('include-mic').addEventListener('change',updateMicrophonePermission);
try {
  microphonePermission = await navigator.permissions.query({name:'microphone'});
  microphonePermission.addEventListener('change',updateMicrophonePermission);
} catch { /* Keep the permission link available when Chrome cannot report its state. */ }
updateMicrophonePermission();
await refresh().catch(error => { $('message').textContent = error.message; });
setInterval(() => void refresh().catch(() => undefined),1000);
