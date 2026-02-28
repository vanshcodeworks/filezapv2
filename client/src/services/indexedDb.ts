const DB_NAME = "FileZapDB";
const STORE_NAME = "settings";
const USERNAME_KEY = "username";

const hasIndexedDb = typeof indexedDB !== "undefined";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) =>
      resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) =>
      reject((event.target as IDBOpenDBRequest).error);
  });
}

export async function saveUsername(name: string): Promise<void> {
  if (!hasIndexedDb) {
    return;
  }

  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(name, USERNAME_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUsername(): Promise<string | undefined> {
  if (!hasIndexedDb) {
    return undefined;
  }

  const db = await getDB();
  return await new Promise<string | undefined>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(USERNAME_KEY);
    request.onsuccess = () => resolve(request.result as string | undefined);
    request.onerror = () => resolve(undefined);
  });
}
