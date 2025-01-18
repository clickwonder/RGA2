import { DataFile } from '../types';

const DB_NAME = 'GeneticSignalDB';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveFileToIndexedDB(file: DataFile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadFilesFromIndexedDB(): Promise<DataFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Convert date strings back to Date objects
      const files = request.result.map((file: DataFile) => ({
        ...file,
        data: file.data.map(bar => ({
          ...bar,
          time: new Date(bar.time)
        }))
      }));
      resolve(files);
    };
  });
}

export async function deleteFileFromIndexedDB(fileId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(fileId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}