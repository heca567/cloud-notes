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
import type { Folder, UserProfile } from "../../../types";
import type { Repository } from "../../shared/data/Repository";

export interface FolderInput {
    name: string;
    color: string;
    icon: string;
}

export const folderRepository = {
    subscribe(
        userId: string,
        onFolders: (folders: Folder[]) => void,
        onError: (error: Error) => void,
    ): () => void {
        const foldersQuery = query(collection(db, "folders"), where("userId", "==", userId));

        return onSnapshot(
            foldersQuery,
            (snapshot) => {
                const folders = snapshot.docs
                    .map((folderDoc) => ({ ...folderDoc.data(), id: folderDoc.id } as Folder))
                    .sort((a, b) => a.name.localeCompare(b.name));
                onFolders(folders);
            },
            onError,
        );
    },

    async create(folder: FolderInput, user: UserProfile, id: string): Promise<Folder> {
        const newFolder: Folder = {
            id,
            userId: user.uid,
            name: folder.name.trim() || "Nueva Carpeta",
            color: folder.color,
            icon: folder.icon,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, "folders", id), newFolder);
        return newFolder;
    },

    async update(id: string, folder: FolderInput): Promise<void> {
        await updateDoc(doc(db, "folders", id), {
            name: folder.name.trim(),
            color: folder.color,
            icon: folder.icon,
            updatedAt: serverTimestamp(),
        });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "folders", id));
    },
} satisfies Repository<Folder, FolderInput, FolderInput>;
