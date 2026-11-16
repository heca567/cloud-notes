import {
    onAuthStateChanged,
    signOut,
    type User,
} from "firebase/auth";
import { auth } from "../../firebase";
import type { UserProfile } from "../../types";

const toUserProfile = (user: User): UserProfile => ({
    uid: user.uid,
    displayName: user.displayName || "Usuario",
    email: user.email,
    photoURL: user.photoURL,
});

export const userProfileRepository = {
    getCurrent(): UserProfile | null {
        return auth.currentUser ? toUserProfile(auth.currentUser) : null;
    },

    subscribe(
        onProfileChanged: (profile: UserProfile | null) => void,
        onError: (error: Error) => void,
    ): () => void {
        return onAuthStateChanged(
            auth,
            (user) => onProfileChanged(user ? toUserProfile(user) : null),
            onError,
        );
    },
    async logout(): Promise<void> {
        await signOut(auth);
    },
};