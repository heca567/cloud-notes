import { useEffect, useReducer, useState } from "react";
import type { Folder, Note, UserProfile } from "../types";
import { folderRepository } from "./storage/Folder";
import { notesRepository } from "./storage/Notes";
import { userProfileRepository } from "./storage/UserProfile";

const initialUIState = {
    loading: false,
    activeFilter: "all",
    mode: "online",
    activeView: "all",
    collapseFiles: false,
    collapseNotes: false,
    editorState: "show",
} as const;

type UIStateType = {
    loading: boolean;
    activeFilter: string;
    mode: "online" | "offline";
    activeView: string;
    collapseFiles: boolean;
    collapseNotes: boolean;
    editorState: "show" | "hide";
    notesBar: {
        sort: 'ALFABETICO' | 'RECIENTE' | 'FECHA' 
    }
};

export const UIACTIONS_TYPES = {
    LOGIN: "LOGIN",
    LOAD: "LOAD",
    LOADING: "LOADING",
    COLLAPSE_FILES: "COLLAPSE_FILES",
    COLLAPSE_NOTES: "COLLAPSE_NOTES",
    CHANGE_EDITOR_MODE: "CHANGE_EDITOR_MODE",
} as const;
export type UIActionType = typeof UIACTIONS_TYPES[keyof typeof UIACTIONS_TYPES];

export type UIAction =
    | { type: typeof UIACTIONS_TYPES.LOGIN }
    | { type: typeof UIACTIONS_TYPES.LOAD }
    | { type: typeof UIACTIONS_TYPES.LOADING }
    | { type: typeof UIACTIONS_TYPES.COLLAPSE_FILES }
    | { type: typeof UIACTIONS_TYPES.COLLAPSE_NOTES }
    | {
        type: typeof UIACTIONS_TYPES.CHANGE_EDITOR_MODE;
        payload: UIStateType["editorState"];
    };

export const UIReducer = (state: UIStateType, action: UIAction): UIStateType => {
    switch (action.type) {
        case 'LOADING':
            return { ...state, loading: true };
        case "LOAD":
            return { ...state, loading: false };
        case 'LOGIN':
            return {
                ...state,
                loading: false,
                activeFilter: 'all',
                mode: 'online',
                activeView: 'all',
                collapseFiles: false,
                collapseNotes: false,
                editorState: 'show'
            };
        case "COLLAPSE_FILES":
            return { ...state, collapseFiles: !state.collapseFiles };
        case "COLLAPSE_NOTES":
            return { ...state, collapseNotes: !state.collapseNotes };
        case "CHANGE_EDITOR_MODE":
            return { ...state, editorState: action.payload };
        default: {
            const exhaustiveCheck: never = action;
            return exhaustiveCheck;
        }
    }
};

export const useApp = () => {
    const [uiState, dispatchUIAction] = useReducer(UIReducer, initialUIState);
    const [notes, setNotes] = useState<Note[]>([]); // cambiar a {selected: boolean, note: Note}
    const [folders, setFolders] = useState<Folder[]>([]);
    const [session, setSession] = useState<UserProfile | null>(null);
    let unsubscribeNotes: (() => void) | undefined;
    let unsubscribeFolders: (() => void) | undefined;
    useEffect(() => {
        const unsubscribeProfile = userProfileRepository.subscribe(
            (user) => {
                cleanSession()
                setSession(user);
                if (!user) return;
                load(user)
            },
            (error) => console.error("User profile subscription failed:", error),
        );

        return () => {
            unsubscribeProfile();
            unsubscribeNotes?.();
            unsubscribeFolders?.();
        };
    }, []);
    
    const cleanSession = () => {
        unsubscribeNotes?.();
        unsubscribeFolders?.();
        unsubscribeNotes = undefined;
        unsubscribeFolders = undefined;
        setNotes([]);
        setFolders([]);
    }

    const load = (user: UserProfile) => {
        unsubscribeNotes = notesRepository.subscribe(
            user.uid,
            setNotes,
            (error) => console.error("Notes subscription failed:", error),
        );
        unsubscribeFolders = folderRepository.subscribe(
            user.uid,
            setFolders,
            (error) => console.error("Folders subscription failed:", error),
        );
    }
    const calculateActive = ()=> {
        // lee el array de activos y calcula los indices de los activos
    }
    const selectNotes = (id)=> {
        // cambia el estado de esa nota a seleccionado
    }
    
    const createFolder = ({}) => {
        // crear el folder
        // actualizar el estado de folder
    }
    const createNote = ({}) => {
        // crear el folder
        // actualizar el estado de folder
    }
    const sortNotes = (sort)=> {
        // cambiar el estado de sort
        // calcular el orden depndiendo que tipo de orden quiere
        // setNotes(nuevo orden)
    }
    const searchNotes = (serachWord)=> {
        // realizar la busqueda por titulo
        // setNotes(nuevo array)
    }
    const logout = () => {
        // llamar a logout
        // llamar cleansession
        // resetear el estado 
    }
    
    return { notes, folders, session, uiState, dispatchUIAction };
};

