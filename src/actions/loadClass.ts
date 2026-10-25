import { QuerySnapshot, DocumentData, query, collection, where, onSnapshot } from "firebase/firestore";
import { Folder as TFolder, Note as TNote } from "../types";
import { db } from "../firebase";

export type SortFunction = <T>(list: any[] | T[]) => any[] | T[]

export class FolderClass {
    path: string = 'folders';
    private _data: TFolder[] = [];

    private createQuery({ user }: any) {
        return query(collection(db, this.path), where('userId', '==', user.uid));
    }

    load = ({ user, onData, onError }: { user: any; onData: (data: TFolder[]) => void; onError: (err: Error) => void }) => {
        const q = this.createQuery({ user });
        
        return onSnapshot(
            q,
            (snapshot) => {
                const folderList: TFolder[] = [];
                snapshot.forEach((docSnap) => {
                    folderList.push(docSnap.data() as TFolder);
                });
                this._data = folderList;
                
                // Devolvemos los datos ya ordenados a través del callback
                onData(this.data);
            },
            (error) => {
                onError(new Error(`Error loading folders: ${error.message}`));
            }
        );
    }

    get data(): TFolder[] {
        return this.sort(this._data);    
    }

    private sort(list: TFolder[]): TFolder[] {
        // Creamos una copia con [...list] para evitar mutar directamente el array interno
        return [...list].sort((a, b) => a?.name.localeCompare(b?.name));
    }
}

// Instanciamos el repositorio para usarlo
export const folderRepo = new FolderClass();


export class NotesClass {
    path: string = 'notes';
    private _data: TNote[] = [];

    private createQuery({ user }: any) {
        return query(collection(db, this.path), where('userId', '==', user.uid));
    }

    load = ({ user, onData, onError }: { user: any; onData: (data: TNote[]) => void; onError: (err: Error) => void }) => {
        const q = this.createQuery({ user });
        
        return onSnapshot(
            q,
            (snapshot) => {
                const noteList: TNote[] = [];
                snapshot.forEach((docSnap) => {
                    noteList.push(docSnap.data() as TNote);
                });
                this._data = noteList;
                
                // Devolvemos los datos ya ordenados a través del callback
                onData(this.data);
            },
            (error) => {
                onError(new Error(`Error loading notes: ${error.message}`));
            }
        );
    }

    get data(): TNote[] {
        return this.sort(this._data);    
    }

    private sort(list: TNote[]): TNote[] {
        // Creamos una copia con [...list] para evitar mutar directamente el array interno
        return sortNote([...list]);
    }   
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

// Instanciamos el repositorio para usarlo
export const notesRepo = new NotesClass();

