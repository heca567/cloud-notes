import { collection, query, where } from "firebase/firestore";
import { auth, googleProvider, signInWithPopup } from "../firebase";
import { createQuery } from "./load";


const loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        console.error('Login error:', err);
    }
};






export const doLogin = async () => { 
    await loginWithGoogle()
 }

 export const loadFolders = async ({db, path, user}: any) => {
    const foldersQuery = createQuery({db, path, user});
    const carpetas = []
    const notas = []
    console.log(`se cargaron ${carpetas.length} y estas notas ${notas.length}`)
 }