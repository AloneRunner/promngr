
const DB_NAME = 'ProManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

export const dbRequest = (type: 'readwrite' | 'readonly', callback: (store: IDBObjectStore) => IDBRequest | void): Promise<any> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = db.transaction(STORE_NAME, type);
            const store = tx.objectStore(STORE_NAME);

            try {
                const req = callback(store);
                if (req) {
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                } else {
                    tx.oncomplete = () => resolve(undefined);
                    tx.onerror = () => reject(tx.error);
                }
            } catch (err) {
                reject(err);
            }
        };

        request.onerror = () => reject(request.error);
    });
};

export const setItem = (key: string, value: any): Promise<void> => {
    return dbRequest('readwrite', store => store.put(value, key));
};

export const getItem = <T>(key: string): Promise<T | undefined> => {
    return dbRequest('readonly', store => store.get(key));
};

export const removeItem = (key: string): Promise<void> => {
    return dbRequest('readwrite', store => store.delete(key));
};

export const clear = (): Promise<void> => {
    return dbRequest('readwrite', store => store.clear());
};
