import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { handleFirestoreError, OperationType } from "../../../firebase";
import type { Note, UserProfile } from "../../../types";
import type { UIAction } from "../../../state/actions";
import { notesRepository } from "./notesRepository";
import type { NoteUpdates } from "./notesRepository";

type NoteOperation = "UPDATE_NOTE" | "RESTORE_NOTE" | "TOGGLE_PIN_NOTE" | "MOVE_NOTE_TO_FOLDER";
type OperationStatus = "started" | "succeeded" | "failed";

interface UseNoteOptions {
    user: UserProfile | null;
    notes: Note[];
    setNotes: Dispatch<SetStateAction<Note[]>>;
    dispatch: Dispatch<UIAction>;
}



const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export const useNote = ({ user, notes, setNotes, dispatch }: UseNoteOptions) => {
    const dispatchUpdateStatus = useCallback((
        type: NoteOperation,
        status: OperationStatus,
        message?: string,
    ) => {
        switch (type) {
            case "UPDATE_NOTE":
            case "RESTORE_NOTE":
            case "TOGGLE_PIN_NOTE":
            case "MOVE_NOTE_TO_FOLDER":
                if (status === "started") {
                    dispatch({ type, status });
                } else if (status === "failed") {
                    dispatch({
                        type,
                        status,
                        errorMessage: message ?? "Error al actualizar la nota",
                    });
                } else {
                    dispatch({ type, status, payload: { updatedAt: new Date() } });
                }
                break;
        }
    }, [dispatch]);

    const updateNote = useCallback(async (
        id: string,
        updates: NoteUpdates,
        operation: NoteOperation = "UPDATE_NOTE",
    ): Promise<void> => {
        if (!user) return;

        dispatchUpdateStatus(operation, "started");
        try {
            await notesRepository.update(id, updates);
            setNotes((currentNotes) => currentNotes.map((note) =>
                note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note,
            ));
            dispatchUpdateStatus(operation, "succeeded");
        } catch (error) {
            dispatchUpdateStatus(operation, "failed", errorMessage(error));
            handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
        }
    }, [dispatchUpdateStatus, setNotes, user]);

    const deleteNote = useCallback(async (id: string, permanent = false): Promise<void> => {
        if (!user) return;

        dispatch({ type: "DELETE_NOTE", status: "started" });
        const operation = permanent ? OperationType.DELETE : OperationType.UPDATE;
        try {
            if (permanent) {
                await notesRepository.delete(id);
                setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
            } else {
                await notesRepository.update(id, { isArchived: true });
                setNotes((currentNotes) => currentNotes.map((note) =>
                    note.id === id
                        ? { ...note, isArchived: true, updatedAt: new Date() }
                        : note,
                ));
            }
            dispatch({
                type: "DELETE_NOTE",
                status: "succeeded",
                payload: { noteId: id, permanent, updatedAt: new Date() },
            });
        } catch (error) {
            dispatch({
                type: "DELETE_NOTE",
                status: "failed",
                errorMessage: errorMessage(error),
            });
            handleFirestoreError(error, operation, `notes/${id}`);
        }
    }, [dispatch, setNotes, user]);

    const restoreNote = useCallback((id: string) =>
        updateNote(id, { isArchived: false }, "RESTORE_NOTE"), [updateNote]);

    const togglePinNote = useCallback((id: string): Promise<void> => {
        const note = notes.find((item) => item.id === id);
        if (!note) return Promise.resolve();
        return updateNote(id, { isPinned: !note.isPinned }, "TOGGLE_PIN_NOTE");
    }, [notes, updateNote]);

    const moveNoteToFolder = useCallback((noteId: string, folderId: string) =>
        updateNote(noteId, { folderId }, "MOVE_NOTE_TO_FOLDER"), [updateNote]);

    return { updateNote, deleteNote, restoreNote, togglePinNote, moveNoteToFolder };
};
