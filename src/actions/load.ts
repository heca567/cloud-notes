import { QuerySnapshot, DocumentData } from "firebase/firestore";
import { type Folder as TFolder, type Note as TNote } from "../types";
import { collection, query, where } from "firebase/firestore";

export type SortFunction = <T>(list: any[] | T[]) => any[] | T[]

export const sortFolder: SortFunction = (list) => {
    return list.sort((a, b) => a?.name.localeCompare(b?.name))
}
export const sortNote: SortFunction = (list) => {
    return list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const timeA = a.updatedAt?.toMillis
            ? a.updatedAt.toMillis()
            : (a.updatedAt?.seconds
                ? a.updatedAt.seconds * 1000 : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
        return timeB - timeA;
    });
}
export interface DocumentService <T>{
    loadList: (snapshot: QuerySnapshot<DocumentData>) => Promise<T[]>;
    sort: SortFunction;
}
const FolderService: DocumentService<TFolder> = {
    loadList: async (snapshot: QuerySnapshot<DocumentData>) => {
        const list = snapshot.docs.map(doc => doc.data() as TFolder);
        return list;
    },
    sort: sortFolder
};
const NoteService: DocumentService<TNote> = {
    loadList: async (snapshot: QuerySnapshot<DocumentData>) => {
        const list = snapshot.docs.map(doc => doc.data() as TNote);
        return list;
    },
    sort: sortNote
};

export const createQuery = async ({db, path, user}: any) => {
    return query(collection(db, path), where('userId', '==', user.uid))
}

export const load = async () => {
    const notes = await NoteService.loadList();
    const folders = await FolderService.loadList();
    return { notes, folders };
}