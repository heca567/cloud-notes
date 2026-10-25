import React, { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, handleFirestoreError, OperationType } from '../firebase';
import type { Note, Folder, ViewFilter, UserProfile } from '../types';
import { folderRepo, notesRepo } from '../actions/loadClass';
import { addNoteToFirestore, createNewFolder, createNewNote, deleteFolderFromFirestore, deleteNoteFromFirestore, findNoteById, findNoteInFolder, updateFolderInFirestore, updateNoteInFirestore } from '../actions/actions';

export type SyncState = 'synced' | 'saving' | 'error';

interface NotesContextType {
  user: UserProfile | null;
  authLoading: boolean;
  notes: Note[];
  folders: Folder[];
  activeFilter: ViewFilter;
  selectedNoteId: string | null;
  searchQuery: string;
  syncState: SyncState;
  lastSyncTime: Date | null;
  isOnline: boolean;
  mobileView: 'list' | 'editor';
  setMobileView: (view: 'list' | 'editor') => void;
  setActiveFilter: (filter: ViewFilter) => void;
  setSelectedNoteId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  createNote: (folderId?: string) => Promise<string | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string, permanent?: boolean) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  moveNoteToFolder: (noteId: string, folderId: string) => Promise<void>;
  createFolder: (name: string, color?: string, icon?: string) => Promise<string | null>;
  updateFolder: (id: string, name: string, color: string, icon: string) => Promise<void>;
  deleteFolder: (id: string, moveNotesToRoot?: boolean) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);
function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const [, startTransition] = useTransition();
  

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('synced');
    };
    const handleOffline = () => { setIsOnline(false) };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setNotes([]);
        setFolders([]);
        setSelectedNoteId(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    const handleSyncError = (operationType: OperationType, path: string) => (error: unknown) => {
      setSyncState('error');
      handleFirestoreError(error, operationType, path);
    };
    if (!user) return;
    let unsubscribeFolders: (() => void) | undefined;

    try {
      unsubscribeFolders = folderRepo.load({
        user,
        onData: (folders) => {
          startTransition(() => {
            setFolders(folders);
            setLastSyncTime(new Date());
            setSyncState('synced');
          });
        },
        onError: handleSyncError(OperationType.LIST, 'folders'),
      });
    } catch (error) {
      setSyncState('error');
      handleFirestoreError(error, OperationType.LIST, 'folders');
    }


    const unsubscribeNotes = notesRepo.load({
      user,
      onData: (notes) => {
        startTransition(() => {
          setNotes(notes);
          setLastSyncTime(new Date());
          setSyncState('synced');
        });
      },
      onError: handleSyncError(OperationType.LIST, 'notes')
    });

    return () => {
      if (unsubscribeFolders && unsubscribeNotes) {
        unsubscribeFolders();
        unsubscribeNotes();
      }
    };
  }, [user]);

  const createNote = async (folderId?: string): Promise<string | null> => {
    if (!user) return null;
    setSyncState('saving');
    const effectiveFolderId = folderId !== undefined
      ? folderId
      : (activeFilter !== 'all' && activeFilter !== 'unorganized' && activeFilter !== 'pinned' && activeFilter !== 'trash'
        ? activeFilter
        : '');
    const newNote = createNewNote(effectiveFolderId, user.uid);
    const newId = newNote.id;
    const path = `notes/${newId}`;
    try {
      await addNoteToFirestore(newNote);
      setSelectedNoteId(newId);
      setMobileView('editor');
      setSyncState('synced');
      setLastSyncTime(new Date());
      return newId;
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.CREATE, path);
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>): Promise<void> => {
    if (!user) return;
    setSyncState('saving');
    const path = `notes/${id}`;
    try {
      await updateNoteInFirestore(id, updates);
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteNote = async (id: string, permanent = false): Promise<void> => {
    if (!user) return;
    setSyncState('saving');
    const path = `notes/${id}`;
    try {
      if (permanent) {
        await deleteNoteFromFirestore(id);
      } else {
        await updateNoteInFirestore(id, { isArchived: true });
      }
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, permanent ? OperationType.DELETE : OperationType.UPDATE, path);
    }
  };

  const restoreNote = async (id: string): Promise<void> => {
    if (!user) return;
    setSyncState('saving');
    const path = `notes/${id}`;
    try {
      await updateNoteInFirestore(id, { isArchived: false });
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const togglePinNote = async (id: string): Promise<void> => {
    const note = findNoteById(notes, id);
    if (!note) return;
    await updateNote(id, { isPinned: !note.isPinned });
  };

  const moveNoteToFolder = async (noteId: string, folderId: string): Promise<void> => {
    await updateNote(noteId, { folderId });
  };

  const createFolder = async (name: string, color = '#3b82f6', icon = 'folder'): Promise<string | null> => {
    if (!user) return null;
    setSyncState('saving');
    const newId = generateId();
    const path = `folders/${newId}`;
    try {
      await createNewFolder(name, color, icon, user.uid, newId);
      setActiveFilter(newId);
      setSyncState('synced');
      setLastSyncTime(new Date());
      return newId;
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.CREATE, path);
      return null;
    }
  };

  const updateFolder = async (id: string, name: string, color: string, icon: string): Promise<void> => {
    if (!user) return;
    setSyncState('saving');
    const path = `folders/${id}`;
    try {
      await updateFolderInFirestore(id, { name, color, icon });
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteFolder = async (id: string, moveNotesToRoot = true): Promise<void> => {
    if (!user) return;
    setSyncState('saving');

    // Handle notes belonging to this folder
    const notesInFolder = findNoteInFolder(notes, id);
    if (moveNotesToRoot) {
      for (const note of notesInFolder) {
        await updateNote(note.id, { folderId: '' });
      }
    } else {
      for (const note of notesInFolder) {
        await deleteNote(note.id, false);
      }
    }

    const path = `folders/${id}`;
    try {
      await deleteFolderFromFirestore(id);
      if (activeFilter === id) {
        setActiveFilter('all');
      }
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        user,
        authLoading,
        notes,
        folders,
        activeFilter,
        selectedNoteId,
        searchQuery,
        syncState,
        lastSyncTime,
        isOnline,
        mobileView,
        setMobileView,
        setActiveFilter,
        setSelectedNoteId,
        setSearchQuery,
        createNote,
        updateNote,
        deleteNote,
        restoreNote,
        togglePinNote,
        moveNoteToFolder,
        createFolder,
        updateFolder,
        deleteFolder,
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
