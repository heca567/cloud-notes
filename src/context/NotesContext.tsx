import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { handleFirestoreError, OperationType } from '../firebase';
import type { Note, Folder } from '../types';
import { useFolder } from '../features/folders/data/useFolder';
import { useAuth } from '../features/auth/useAuth';
import { useNotes as useNotesData } from '../features/notes/data/useNotes';
import { INITIAL_UI_STATE, type UIState } from '../state/uiState';
import { uiReducer } from '../state/actions';

type NotesContextType = {
  state: UIState;
  setMobileView: (view: 'list' | 'editor') => void;
  setActiveFilter: (filter: UIState['activeFilter']) => void;
  setSelectedNoteId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapsed: () => void;
  toggleNoteListCollapsed: () => void;
  setNoteListCollapsed: (isCollapsed: boolean) => void;
} & ReturnType<typeof useAuth>
  & ReturnType<typeof useNotesData>
  & ReturnType<typeof useFolder>;

const NotesContext = createContext<NotesContextType | null>(null);

export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, INITIAL_UI_STATE);
  const [folders, setFolders] = useState<Folder[]>([]);
  const authFeature = useAuth(dispatch);

  // Listen to network status
  useEffect(() => {
    dispatch({ type: 'SET_ONLINE', payload: { isOnline: navigator.onLine } });
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: { isOnline: true } });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: { isOnline: false } });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const notesFeature = useNotesData({ user: state.logged, dispatch, generateId });

  const folderFeature = useFolder({
    user: state.logged,
    isOnline: state.isOnline,
    folders,
    setFolders,
    notes: notesFeature.notes,
    dispatch,
    generateId,
    updateNote: notesFeature.updateNote,
    deleteNote: notesFeature.deleteNote,
  });

  return (
    <NotesContext.Provider
      value={{
        state,
        ...authFeature,
        ...notesFeature,
        ...folderFeature,
        setMobileView: (view) => dispatch({ type: 'SET_MOBILE_VIEW', payload: { view } }),
        setActiveFilter: (filter) => dispatch({ type: 'SET_ACTIVE_FILTER', payload: { filter } }),
        setSelectedNoteId: (id) => dispatch({ type: 'SET_SELECTED_NOTE_ID', payload: { noteId: id } }),
        setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } }),
        setMobileSidebarOpen: (isOpen) => dispatch({
          type: 'SET_MOBILE_SIDEBAR_OPEN',
          payload: { isOpen },
        }),
        toggleSidebarCollapsed: () => dispatch({ type: 'TOGGLE_SIDEBAR_COLLAPSED' }),
        toggleNoteListCollapsed: () => dispatch({ type: 'TOGGLE_NOTE_LIST_COLLAPSED' }),
        setNoteListCollapsed: (isCollapsed) => dispatch({
          type: 'SET_NOTE_LIST_COLLAPSED',
          payload: { isCollapsed },
        }),
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
