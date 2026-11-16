import type { UserProfile, ViewFilter } from "../types";
import type { SyncState, UIState } from "./uiState";

type AsyncAction<T extends string, Payload = never> =
    | { type: T; status: "started" }
    | { type: T; status: "failed"; errorMessage: string }
    | ([Payload] extends [never]
        ? { type: T; status: "succeeded"; payload: { updatedAt: Date } }
        : { type: T; status: "succeeded"; payload: Payload & { updatedAt: Date } });

export type UIAction =
    | { type: "LOGIN"; payload: { userProfile: UserProfile } }
    | { type: "LOGOUT" }
    | { type: "SET_ACTIVE_FILTER"; payload: { filter: ViewFilter } }
    | { type: "SET_SELECTED_NOTE_ID"; payload: { noteId: string | null } }
    | { type: "SET_SEARCH_QUERY"; payload: { query: string } }
    | { type: "SET_MOBILE_VIEW"; payload: { view: "list" | "editor" } }
    | { type: "SET_MOBILE_SIDEBAR_OPEN"; payload: { isOpen: boolean } }
    | { type: "TOGGLE_SIDEBAR_COLLAPSED" }
    | { type: "TOGGLE_NOTE_LIST_COLLAPSED" }
    | { type: "SET_NOTE_LIST_COLLAPSED"; payload: { isCollapsed: boolean } }
    | { type: "SET_ONLINE"; payload: { isOnline: boolean } }
    | { type: "LOADING" }
    | { type: "FINISH_LOADING" }
    | { type: "LOAD_SUCCESS"; payload: { updatedAt: Date } }
    | { type: "LOAD_ERROR"; payload: { errorMessage: string } }
    | { type: "NOTES_ERROR"; payload: { errorMessage: string } }
    | { type: "NOTES_LOADED"; payload: { noteIds: string[]; firstActiveNoteId: string | null; updatedAt: Date } }
    | AsyncAction<"CREATE_NOTE", { noteId: string }>
    | AsyncAction<"UPDATE_NOTE">
    | AsyncAction<"DELETE_NOTE", { noteId: string; permanent: boolean }>
    | AsyncAction<"RESTORE_NOTE">
    | AsyncAction<"TOGGLE_PIN_NOTE">
    | AsyncAction<"MOVE_NOTE_TO_FOLDER">
    | AsyncAction<"CREATE_FOLDER", { folderId: string }>
    | AsyncAction<"UPDATE_FOLDER">
    | AsyncAction<"DELETE_FOLDER", { folderId: string }>;

function operationSucceeded(state: UIState, updatedAt: Date): UIState {
    return {
        ...state,
        syncState: "synced",
        lastSyncTime: updatedAt,
        errorMessage: null,
    };
}

function operationStarted(state: UIState): UIState {
    return { ...state, syncState: "saving", errorMessage: null };
}

function operationFailed(state: UIState, errorMessage: string): UIState {
    return { ...state, syncState: "error", errorMessage };
}

export function uiReducer(state: UIState, action: UIAction): UIState {
    switch (action.type) {
        case "LOGIN":
            return {
                ...state,
                logged: action.payload.userProfile,
                authLoading: false,
                selectedNoteId: null,
                loading: "idle",
                errorMessage: null,
            };
        case "LOGOUT":
            return {
                ...state,
                logged: null,
                authLoading: false,
                selectedNoteId: null,
                loading: "idle",
                syncState: "synced",
                errorMessage: null,
            };
        case "SET_ACTIVE_FILTER":
            return { ...state, activeFilter: action.payload.filter };
        case "SET_SELECTED_NOTE_ID":
            return { ...state, selectedNoteId: action.payload.noteId };
        case "SET_SEARCH_QUERY":
            return { ...state, searchQuery: action.payload.query };
        case "SET_MOBILE_VIEW":
            return { ...state, mobileView: action.payload.view };
        case "SET_MOBILE_SIDEBAR_OPEN":
            return { ...state, isMobileSidebarOpen: action.payload.isOpen };
        case "TOGGLE_SIDEBAR_COLLAPSED":
            return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
        case "TOGGLE_NOTE_LIST_COLLAPSED":
            return { ...state, isNoteListCollapsed: !state.isNoteListCollapsed };
        case "SET_NOTE_LIST_COLLAPSED":
            return { ...state, isNoteListCollapsed: action.payload.isCollapsed };
        case "SET_ONLINE":
            return {
                ...state,
                isOnline: action.payload.isOnline,
                syncState: action.payload.isOnline ? "synced" : "offline",
            };
        case "LOADING":
            return { ...state, loading: "loading", errorMessage: null };
        case "FINISH_LOADING":
            return { ...state, loading: "idle" };
        case "LOAD_SUCCESS":
            return {
                ...state,
                loading: "idle",
                syncState: "synced",
                lastSyncTime: action.payload.updatedAt,
                errorMessage: null,
            };
        case "LOAD_ERROR":
            return {
                ...state,
                loading: "error",
                syncState: "error",
                errorMessage: action.payload.errorMessage,
            };
        case "NOTES_ERROR":
            return {
                ...state,
                syncState: "error",
                errorMessage: action.payload.errorMessage,
            };
        case "NOTES_LOADED": {
            const selectedNoteExists = state.selectedNoteId !== null
                && action.payload.noteIds.includes(state.selectedNoteId);
            return {
                ...operationSucceeded(state, action.payload.updatedAt),
                selectedNoteId: selectedNoteExists
                    ? state.selectedNoteId
                    : action.payload.firstActiveNoteId,
            };
        }
        case "CREATE_NOTE":
            if (action.status === "started") return operationStarted(state);
            if (action.status === "failed") return operationFailed(state, action.errorMessage);
            return {
                ...operationSucceeded(state, action.payload.updatedAt),
                selectedNoteId: action.payload.noteId,
                mobileView: "editor",
            };
        case "UPDATE_NOTE":
        case "RESTORE_NOTE":
        case "TOGGLE_PIN_NOTE":
        case "MOVE_NOTE_TO_FOLDER":
        case "UPDATE_FOLDER":
            if (action.status === "started") return operationStarted(state);
            if (action.status === "failed") return operationFailed(state, action.errorMessage);
            return operationSucceeded(state, action.payload.updatedAt);
        case "DELETE_NOTE":
            if (action.status === "started") return operationStarted(state);
            if (action.status === "failed") return operationFailed(state, action.errorMessage);
            return {
                ...operationSucceeded(state, action.payload.updatedAt),
                selectedNoteId: action.payload.permanent && state.selectedNoteId === action.payload.noteId
                    ? null
                    : state.selectedNoteId,
            };
        case "CREATE_FOLDER":
            if (action.status === "started") return operationStarted(state);
            if (action.status === "failed") return operationFailed(state, action.errorMessage);
            return {
                ...operationSucceeded(state, action.payload.updatedAt),
                activeFilter: action.payload.folderId,
            };
        case "DELETE_FOLDER":
            if (action.status === "started") return operationStarted(state);
            if (action.status === "failed") return operationFailed(state, action.errorMessage);
            return {
                ...operationSucceeded(state, action.payload.updatedAt),
                activeFilter: state.activeFilter === action.payload.folderId ? "all" : state.activeFilter,
            };
        default: {
            const exhaustiveCheck: never = action;
            return exhaustiveCheck;
        }
    }
}
