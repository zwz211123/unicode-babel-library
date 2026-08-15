const DB_NAME = 'unicode-babel-library';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ['favorites', 'history', 'notes', 'searches']) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putLocal(storeName, record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function getLocal(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
