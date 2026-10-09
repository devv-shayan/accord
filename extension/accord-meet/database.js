// Audio is written to IndexedDB before upload. The browser can retry after a restart.
const database = new Promise((resolve, reject) => {
  const request = indexedDB.open('accord-audio', 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore('sessions', { keyPath: 'key' });
    request.result.createObjectStore('parts', { keyPath: 'key' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function transact(store, mode, run) {
  const db = await database;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = run(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const getSession = key => transact('sessions', 'readonly', store => store.get(key));
export const putSession = session => transact('sessions', 'readwrite', store => store.put(session));
export const allSessions = () => transact('sessions', 'readonly', store => store.getAll());
export const putPart = (session, index, blob) => transact('parts', 'readwrite', store => store.put({ key: `${session}:${index}`, session, index, blob }));
export async function partsFor(key) {
  return (await transact('parts', 'readonly', store => store.getAll())).filter(part => part.session === key).sort((a,b) => a.index - b.index);
}
export async function removeSession(key) {
  const parts = await partsFor(key);
  for (const part of parts) await transact('parts', 'readwrite', store => store.delete(part.key));
  await transact('sessions', 'readwrite', store => store.delete(key));
}
