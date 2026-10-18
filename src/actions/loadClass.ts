import { QuerySnapshot, DocumentData, query, collection, where, onSnapshot } from "firebase/firestore";
import { Folder as TFolder, Note as TNote } from "../types";
import { db } from "../firebase";


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