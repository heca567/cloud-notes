import {
    useCallback,
    useEffect,
    useState,
    useTransition,
    type Dispatch,
} from "react";
import { handleFirestoreError, OperationType } from "../../../firebase";
import type { Note, UserProfile } from "../../../types";
import type { UIAction } from "../../../state/actions";
import { useNote } from "./useNote";
import { notesRepository } from "./notesRepository";
import type { NoteInput } from "./notesRepository";

interface UseNotesOptions {
    user: UserProfile | null;
    dispatch: Dispatch<UIAction>;
    generateId: () => string;
}

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export type NoteSyncState = 'saving' | 'synced' | 'error';
export const useNotes = ({ user, dispatch, generateId }: UseNotesOptions) => {
    const [noteSyncStates, setNoteSyncStates] = useState<Record<string, NoteSyncState>>({});
    const [notes, setNotes] = useState<Note[]>([]);
    const [isPending, startTransition] = useTransition();
    useEffect(() => {
        if (!user) {
            setNotes([]);
            return;
        }

        return notesRepository.subscribe(
            user.uid,
            (syncedNotes) => {
                setNotes(syncedNotes);
                startTransition(() => dispatch({
                    type: "NOTES_LOADED",
                    payload: {
                        noteIds: syncedNotes.map((note) => note.id),
                        firstActiveNoteId: syncedNotes.find((note) => !note.isArchived)?.id ?? null,
                        updatedAt: new Date(),
                    },
                }));
            },
            (error) => {
                dispatch({ type: "NOTES_ERROR", payload: { errorMessage: error.message } });
                handleFirestoreError(error, OperationType.LIST, "notes");
            },
        );
    }, [dispatch, setNotes, startTransition, user]);

    const createNote = useCallback(async (folderId?: string): Promise<string | null> => {
        if (!user) return null;

        dispatch({ type: "CREATE_NOTE", status: "started" });
        const id = generateId();
        noteSyncStates[id] = 'saving';
        const input: NoteInput = {
            folderId: folderId || "",
            title: "Nueva nota",
            content: "",
            isPinned: false,
            isArchived: false,
            color: "#ffffff",
            tags: [],
        };
        try {
            const createdNote = await notesRepository.create(input, user, id);
            setNotes((currentNotes) => [
                ...currentNotes.filter((note) => note.id !== createdNote.id),
                createdNote,
            ]);
            noteSyncStates[id] = 'synced';
            dispatch({
                type: "CREATE_NOTE",
                status: "succeeded",
                payload: { noteId: id, updatedAt: new Date() },
            });
            return id;
        } catch (error) {
            dispatch({
                type: "CREATE_NOTE",
                status: "failed",
                errorMessage: errorMessage(error),
            });
            handleFirestoreError(error, OperationType.CREATE, `notes/${id}`);
            return null;
        }
    }, [dispatch, generateId, setNotes, user]);

    const {
        updateNote,
        deleteNote,
        restoreNote,
        togglePinNote,
        moveNoteToFolder,
    } = useNote({ user, notes, setNotes, dispatch });

    return {
        notes,
        isPending,
        createNote,
        updateNote,
        deleteNote,
        restoreNote,
        togglePinNote,
        moveNoteToFolder,
    };
};
