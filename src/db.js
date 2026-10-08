// Tiny IndexedDB wrapper: sessions hold metadata + recorded video blobs.
const open = () =>
  new Promise((res, rej) => {
    const r = indexedDB.open('cdu-prep', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('sessions', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction('sessions', mode);
    const req = fn(t.objectStore('sessions'));
    t.oncomplete = () => res(req.result);
    t.onerror = () => rej(t.error);
  });
};

export const saveSession = (s) => tx('readwrite', (st) => st.put(s));
export const listSessions = async () =>
  ((await tx('readonly', (st) => st.getAll())) || []).sort((a, b) => b.id - a.id);
export const deleteSession = (id) => tx('readwrite', (st) => st.delete(id));
