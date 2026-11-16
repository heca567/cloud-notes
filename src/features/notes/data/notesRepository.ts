import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../../../firebase";
import type { Note, UserProfile } from "../../../types";
import type { Repository } from "../../shared/data/Repository";

export type NoteInput = Pick<Note, "folderId" | "title" | "content" | "isPinned" | "isArchived" | "color"> & {
    tags?: string[];
};
export type NoteUpdates = Partial<Omit<Note, "id" | "userId" | "createdAt" | "updatedAt">>;

export const notesRepository = {
    subscribe(
        userId: string,
        onNotes: (notes: Note[]) => void,
        onError: (error: Error) => void,
    ): () => void {
        const notesQuery = query(collection(db, "notes"), where("userId", "==", userId));

        return onSnapshot(
            notesQuery,
            (snapshot) => {
                const notes = snapshot.docs
                    .map((noteDoc) => ({ ...noteDoc.data(), id: noteDoc.id } as Note))
                    .sort((a, b) => {
                        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                        const timeA = a.updatedAt?.toMillis
                            ? a.updatedAt.toMillis()
                            : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
                        const timeB = b.updatedAt?.toMillis
                            ? b.updatedAt.toMillis()
                            : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
                        return timeB - timeA;
                    });
                onNotes(notes);
            },
            onError,
        );
    },

    async create(note: NoteInput, user: UserProfile, id: string): Promise<Note> {
        const now = new Date();
        const newNote: Note = {
            ...note,
            id,
            userId: user.uid,
            tags: note.tags ?? [],
            createdAt: now,
            updatedAt: now,
        };
        await setDoc(doc(db, "notes", id), {
            ...newNote,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return newNote;
    },

    async update(id: string, updates: NoteUpdates): Promise<void> {
        await updateDoc(doc(db, "notes", id), {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "notes", id));
    },
} satisfies Repository<Note, NoteInput, NoteUpdates>;
