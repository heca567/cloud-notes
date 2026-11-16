import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    type User,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import type { UserProfile } from "../../types";

const toUserProfile = (user: User): UserProfile => ({
    uid: user.uid,
    displayName: user.displayName || "Usuario",
    email: user.email,
    photoURL: user.photoURL,
});

export const authRepository = {
    subscribe(
        onUserChanged: (user: UserProfile | null) => void,
        onError: (error: Error) => void,
    ): () => void {
        return onAuthStateChanged(
            auth,
            (user) => onUserChanged(user ? toUserProfile(user) : null),
            onError,
        );
    },

    async loginWithGoogle(): Promise<void> {
        await signInWithPopup(auth, googleProvider);
    },

    async logout(): Promise<void> {
        await signOut(auth);
    },
};