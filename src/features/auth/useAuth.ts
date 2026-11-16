import { useCallback, useEffect, type Dispatch } from "react";
import type { UIAction } from "../../state/actions";
import { authRepository } from "./firestore";

export const useAuth = (dispatch: Dispatch<UIAction>) => {
    useEffect(() => authRepository.subscribe(
        (userProfile) => {
            if (userProfile) {
                dispatch({ type: "LOGIN", payload: { userProfile } });
            } else {
                dispatch({ type: "LOGOUT" });
            }
        },
        (error) => {
            console.error("Authentication state listener failed:", error);
        },
    ), [dispatch]);

    const loginWithGoogle = useCallback(
        () => authRepository.loginWithGoogle(),
        [],
    );
    const logout = useCallback(
        () => authRepository.logout(),
        [],
    );

    return { loginWithGoogle, logout };
};