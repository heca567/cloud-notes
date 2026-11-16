import {
    useCallback,
    useEffect,
    type Dispatch,
    type SetStateAction,
} from "react";
import { handleFirestoreError, OperationType } from "../../../firebase";
import type { Folder, Note, UserProfile } from "../../../types";
import type { UIAction } from "../../../state/actions";
import { folderRepository } from "./folderRepository";
import type { FolderInput } from "./folderRepository";
import type { NoteUpdates } from "../../notes/data/notesRepository";

interface UseFolderOptions {
    user: UserProfile | null;
    isOnline: boolean;
    folders: Folder[];
    setFolders: Dispatch<SetStateAction<Folder[]>>;
    notes: Note[];
    dispatch: Dispatch<UIAction>;
    generateId: () => string;
    updateNote: (id: string, updates: NoteUpdates) => Promise<void>;
    deleteNote: (id: string, permanent?: boolean) => Promise<void>;
}

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export const useFolder = ({
    user,
    isOnline,
    folders,
    setFolders,
    notes,
    dispatch,
    generateId,
    updateNote,
    deleteNote,
}: UseFolderOptions) => {
    useEffect(() => {
        if (!user) {
            setFolders([]);
            return;
        }
        if (!isOnline) {
            dispatch({ type: "LOAD_ERROR", payload: { errorMessage: "No internet connection" } });
            return;
        }

        dispatch({ type: "LOADING" });
        return folderRepository.subscribe(
            user.uid,
            (storedFolders) => {
                setFolders(storedFolders);
                dispatch({ type: "LOAD_SUCCESS", payload: { updatedAt: new Date() } });
            },
            (error) => {
                dispatch({ type: "LOAD_ERROR", payload: { errorMessage: error.message } });
                handleFirestoreError(error, OperationType.LIST, "folders");
            },
        );
    }, [dispatch, isOnline, setFolders, user]);

    const createFolder = useCallback(async (
        name: string,
        color = "#3b82f6",
        icon = "folder",
    ): Promise<string | null> => {
        if (!user) return null;
        dispatch({ type: "CREATE_FOLDER", status: "started" });
        const id = generateId();
        const input: FolderInput = { name: name.trim() || "Nueva Carpeta", color, icon };
        try {
            const createdFolder = await folderRepository.create(input, user, id);
            setFolders((currentFolders) => [
                ...currentFolders.filter((folder) => folder.id !== createdFolder.id),
                createdFolder,
            ].sort((a, b) => a.name.localeCompare(b.name)));
            dispatch({
                type: "CREATE_FOLDER",
                status: "succeeded",
                payload: { folderId: createdFolder.id, updatedAt: new Date() },
            });
            return createdFolder.id;
        } catch (error) {
            dispatch({
                type: "CREATE_FOLDER",
                status: "failed",
                errorMessage: errorMessage(error),
            });
            handleFirestoreError(error, OperationType.CREATE, `folders/${id}`);
            return null;
        }
    }, [dispatch, generateId, setFolders, user]);

    const updateFolder = useCallback(async (
        id: string,
        name: string,
        color: string,
        icon: string,
    ): Promise<void> => {
        if (!user) return;

        dispatch({ type: "UPDATE_FOLDER", status: "started" });
        const normalizedName = name.trim();
        try {
            await folderRepository.update(id, { name: normalizedName, color, icon });
            setFolders((currentFolders) => currentFolders.map((folder) =>
                folder.id === id
                    ? { ...folder, name: normalizedName, color, icon }
                    : folder,
            ).sort((a, b) => a.name.localeCompare(b.name)));
            dispatch({
                type: "UPDATE_FOLDER",
                status: "succeeded",
                payload: { updatedAt: new Date() },
            });
        } catch (error) {
            dispatch({
                type: "UPDATE_FOLDER",
                status: "failed",
                errorMessage: errorMessage(error),
            });
            handleFirestoreError(error, OperationType.UPDATE, `folders/${id}`);
        }
    }, [dispatch, setFolders, user]);

    const deleteFolder = useCallback(async (
        id: string,
        moveNotesToRoot = true,
    ): Promise<void> => {
        if (!user) return;

        dispatch({ type: "DELETE_FOLDER", status: "started" });
        const notesInFolder = notes.filter((note) => note.folderId === id);
        for (const note of notesInFolder) {
            if (moveNotesToRoot) {
                await updateNote(note.id, { folderId: "" });
            } else {
                await deleteNote(note.id, false);
            }
        }

        try {
            await folderRepository.delete(id);
            setFolders((currentFolders) => currentFolders.filter((folder) => folder.id !== id));
            dispatch({
                type: "DELETE_FOLDER",
                status: "succeeded",
                payload: { folderId: id, updatedAt: new Date() },
            });
        } catch (error) {
            dispatch({
                type: "DELETE_FOLDER",
                status: "failed",
                errorMessage: errorMessage(error),
            });
            handleFirestoreError(error, OperationType.DELETE, `folders/${id}`);
        }
    }, [deleteNote, dispatch, notes, setFolders, updateNote, user]);

    return { folders, createFolder, updateFolder, deleteFolder };
};
