import type { Note } from "../../types";

const DATABASE_NAME = "cloud-notes";
const DATABASE_VERSION = 1;
const NOTES_STORE = "notes";

export interface OfflineNote extends Note {
    synced: boolean;
    revision: number;
}

function openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === "undefined") {
        return Promise.reject(new Error("IndexedDB is not available in this environment."));
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(NOTES_STORE)) {
                const store = database.createObjectStore(NOTES_STORE, { keyPath: "id" });
                store.createIndex("userId", "userId", { unique: false });
            }
        };
        request.onsuccess = () => {
            const database = request.result;
            database.onversionchange = () => database.close();
            resolve(database);
        };
        request.onerror = () => reject(request.error ?? new Error("Unable to open the notes database."));
        request.onblocked = () => reject(new Error("Opening the notes database was blocked."));
    });
}

function transactionCompletion(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error ?? new Error("The notes transaction was aborted."));
        transaction.onerror = () => reject(transaction.error ?? new Error("The notes transaction failed."));
    });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("The IndexedDB request failed."));
    });
}

export async function saveOfflineNote(note: Note): Promise<OfflineNote> {
    const database = await openDatabase();
    const transaction = database.transaction(NOTES_STORE, "readwrite");
    const completion = transactionCompletion(transaction);
    const store = transaction.objectStore(NOTES_STORE);
    try {
        const existing = await requestResult(store.get(note.id)) as OfflineNote | undefined;
        const savedNote: OfflineNote = {
            ...note,
            synced: false,
            revision: (existing?.revision ?? 0) + 1,
        };

        await requestResult(store.put(savedNote));
        await completion;
        return savedNote;
    } finally {
        await completion.catch(() => undefined);
        database.close();
    }
}

export async function getOfflineNotes(userId: string): Promise<OfflineNote[]> {
    const database = await openDatabase();
    const transaction = database.transaction(NOTES_STORE, "readonly");
    const completion = transactionCompletion(transaction);
    try {
        const notes = await requestResult(
            transaction.objectStore(NOTES_STORE).index("userId").getAll(userId),
        ) as OfflineNote[];
        await completion;
        return notes;
    } finally {
        await completion.catch(() => undefined);
        database.close();
    }
}

export async function getPendingOfflineNotes(userId?: string): Promise<OfflineNote[]> {
    const database = await openDatabase();
    const transaction = database.transaction(NOTES_STORE, "readonly");
    const completion = transactionCompletion(transaction);
    try {
        const notes = await requestResult(transaction.objectStore(NOTES_STORE).getAll()) as OfflineNote[];
        await completion;
        return notes.filter((note) => !note.synced && (!userId || note.userId === userId));
    } finally {
        await completion.catch(() => undefined);
        database.close();
    }
}

async function markOfflineNoteSynced(note: OfflineNote): Promise<boolean> {
    const database = await openDatabase();
    const transaction = database.transaction(NOTES_STORE, "readwrite");
    const completion = transactionCompletion(transaction);
    const store = transaction.objectStore(NOTES_STORE);
    try {
        const current = await requestResult(store.get(note.id)) as OfflineNote | undefined;
        if (!current || current.userId !== note.userId || current.revision !== note.revision) {
            await completion;
            return false;
        }

        await requestResult(store.put({ ...current, synced: true }));
        await completion;
        return true;
    } finally {
        await completion.catch(() => undefined);
        database.close();
    }
}

export async function syncPendingOfflineNotes(
    syncNote: (note: Note) => Promise<void>,
    userId?: string,
): Promise<number> {
    const pendingNotes = await getPendingOfflineNotes(userId);
    let syncedCount = 0;

    for (const note of pendingNotes) {
        await syncNote(note);
        if (await markOfflineNoteSynced(note)) syncedCount += 1;
    }

    return syncedCount;
}

export function watchConnectivity(onChange: (isOnline: boolean) => void): () => void {
    const handleOnline = () => onChange(true);
    const handleOffline = () => onChange(false);

    if (typeof window === "undefined") {
        throw new Error("Connectivity events are not available in this environment.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
}