
import { auth, googleProvider, signInWithPopup, signOut } from "../firebase";


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

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (err) {
        console.error('Logout error:', err);
    }
}
