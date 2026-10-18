import { QuerySnapshot, DocumentData } from "firebase/firestore";
import { Folder, Note } from "../types";

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

class Document<T> {
    _data: T[];
    sortFn!: SortFunction
    constructor() {
        this._data = [];
    }
    async loadList(snapshot: QuerySnapshot<DocumentData>): Promise<T[]> {
        const list: T[] = [];
        snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as T);
        });
        this._data = list;
        return list;
    }
    get data(): T[] {
        return this._data;
    }
    sort(): any[] {
        return this.sortFn(this.data);
    }
}

class FolderClass extends Document<Folder> {
    sortFn: SortFunction = sortFolder
    constructor() {
        super()
    }
}
class NoteClass extends Document<Note> {
    sortFn: SortFunction = sortNote
    constructor() {
        super()
    }
}


export const loadFromFirestore = async <T>(snapshot: QuerySnapshot<DocumentData>, documentClass: new () => Document<T>): Promise<T[]> => {
    const doc = new documentClass()
    await doc.loadList(snapshot)
    const listSorted = doc.sort();
    return listSorted;
};

