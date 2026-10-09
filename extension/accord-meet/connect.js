const { pendingConnection } = await chrome.storage.session.get('pendingConnection');
const message = document.getElementById('message'), button = document.getElementById('connect');
if (!pendingConnection || pendingConnection.expiresAt <= Date.now()) { message.textContent = 'Open Accord and request a new connection.'; button.disabled = true; }
else document.getElementById('origin').textContent = pendingConnection.origin;
button.addEventListener('click',async () => {
  try {
    // Request only the origin that the user can see and approve on this page.
    const allowed = await chrome.permissions.request({ origins: [`${pendingConnection.origin}/*`] });
    if (!allowed) throw new Error('Site access was not granted.');
    button.disabled = true;
    const response = await fetch(`${pendingConnection.origin}/api/extension/status`, { headers: { Authorization: `Bearer ${pendingConnection.token}` }, credentials: 'omit', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('The Accord connection expired. Request a new connection from Accord.');
    const account = await response.json();
    await chrome.storage.local.set({ connection: { ...pendingConnection, name: account.name } });
    await chrome.storage.session.remove('pendingConnection');
    message.textContent = `Connected as ${account.name}. Pin Accord in Chrome. Then join a Meet call and click Start recording.`;
    document.getElementById('cancel').textContent = 'Close';
  } catch (error) { message.textContent = error.message; button.disabled = false; }
});
document.getElementById('cancel').addEventListener('click',() => window.close());
