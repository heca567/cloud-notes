import type { UserProfile, ViewFilter } from "../types";
export type SyncState = 'synced' | 'saving' | 'offline' | 'error';
export interface UIState {
    loading: "loading" | "error" | "idle"; // representa el estado de la carga si esta cargando en espera o si hubo un error
    authLoading: boolean;
    logged: null | UserProfile; // representa si el usuario esta logueado o no
    activeFilter: ViewFilter; // representa el filtro activo de la vista de notas
    selectedNoteId: string | null; // representa la nota seleccionada actualmente para su visualización o edición 
    searchQuery: string; // representa la consulta de búsqueda actual para filtrar las notas NO ESTOY MUY SEGURO si pertence a UIState o a datos
    lastSyncTime: Date | null; // representa la fecha y hora de la última sincronización exitosa con el servidor
    isOnline: boolean; // representa si la aplicación está en línea o sin conexión
    mobileView: "list" | "editor";
    isMobileSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    isNoteListCollapsed: boolean;
    syncState: SyncState;
    errorMessage: string | null; // representa el mensaje de error actual
}
export const INITIAL_UI_STATE: UIState = {
    loading: "idle",
    authLoading: true,
    logged: null,
    activeFilter: "all",
    selectedNoteId: null,
    searchQuery: "",
    lastSyncTime: new Date(),
    isOnline: true,
    mobileView: "list",
    isMobileSidebarOpen: false,
    isSidebarCollapsed: false,
    isNoteListCollapsed: false,
    syncState: "synced",
    errorMessage: null,
};