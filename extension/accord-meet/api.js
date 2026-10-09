export async function connection() {
  // An offscreen document has only chrome.runtime. Ask the worker for credentials.
  const { connection, error } = chrome.storage?.local ? await chrome.storage.local.get('connection') : await chrome.runtime.sendMessage({ type: 'recorder-connection' });
  if (error) throw new Error(error);
  if (!connection || connection.expiresAt <= Date.now()) throw new Error('Open Accord and connect this extension again.');
  return connection;
}
export async function api(path, options = {}, expectedOrigin) {
  const linked = await connection();
  if (expectedOrigin && expectedOrigin !== linked.origin) throw new Error('Connect to the same Accord site before you retry this recording.');
  const response = await fetch(`${linked.origin}${path}`, {
    ...options, credentials: 'omit', cache: 'no-store',
    headers: { ...options.headers, Authorization: `Bearer ${linked.token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Accord could not receive the recording. Retry the upload.');
  return result;
}
export function json(method, body) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
