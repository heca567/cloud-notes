import React, { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, googleProvider, signInWithPopup, signOut, handleFirestoreError, OperationType } from '../firebase';
import type { Note, Folder, ViewFilter, UserProfile } from '../types';
import { Folder as FolderClass, folderRepo } from '../actions/loadClass';

export type SyncState = 'synced' | 'saving' | 'offline' | 'error';

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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
  const FolderRepo = useMemo(() => new FolderClass(), []);
  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

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
            onError: (error) => {
                setSyncState('error');
                handleFirestoreError(error, OperationType.LIST, 'folders');
            }
        });
    } catch (error) {
        setSyncState('error');
        handleFirestoreError(error, OperationType.LIST, 'folders');
    }
    

    const notesPath = 'notes';
    const notesQuery = query(collection(db, notesPath), where('userId', '==', user.uid));

    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notesList: Note[] = [];
        snapshot.forEach((docSnap) => {
          notesList.push(docSnap.data() as Note);
        });

        // Sort: pinned first, then by updatedAt descending
        notesList.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        startTransition(() => {
          setNotes(notesList);
          setLastSyncTime(new Date());
          setSyncState('synced');

          // Auto-select first note if none selected or if previously selected was deleted
          setSelectedNoteId((prev) => {
            if (prev && notesList.some((n) => n.id === prev)) {
              return prev;
            }
            const activeNotes = notesList.filter((n) => !n.isArchived);
            return activeNotes.length > 0 ? activeNotes[0].id : null;
          });
        });
      },
      (error) => {
        setSyncState('error');
        handleFirestoreError(error, OperationType.LIST, notesPath);
      }
    );

    return () => {
      if (unsubscribeFolders) {
        unsubscribeFolders();
      }
      unsubscribeNotes();
    };
  }, [user]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const createNote = async (folderId?: string): Promise<string | null> => {
    if (!user) return null;
    setSyncState('saving');
    const newId = generateId();
    const effectiveFolderId = folderId !== undefined 
      ? folderId 
      : (activeFilter !== 'all' && activeFilter !== 'unorganized' && activeFilter !== 'pinned' && activeFilter !== 'trash' 
          ? activeFilter 
          : '');

    const newNote: Note = {
      id: newId,
      userId: user.uid,
      folderId: effectiveFolderId,
      title: 'Nueva nota',
      content: '',
      isPinned: false,
      isArchived: false,
      color: '#ffffff',
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const path = `notes/${newId}`;
    try {
      await setDoc(doc(db, 'notes', newId), newNote);
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
      await updateDoc(doc(db, 'notes', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
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
        await deleteDoc(doc(db, 'notes', id));
      } else {
        await updateDoc(doc(db, 'notes', id), {
          isArchived: true,
          updatedAt: serverTimestamp(),
        });
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
      await updateDoc(doc(db, 'notes', id), {
        isArchived: false,
        updatedAt: serverTimestamp(),
      });
      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      setSyncState('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const togglePinNote = async (id: string): Promise<void> => {
    const note = notes.find((n) => n.id === id);
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
    const newFolder: Folder = {
      id: newId,
      userId: user.uid,
      name: name.trim() || 'Nueva Carpeta',
      color,
      icon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const path = `folders/${newId}`;
    try {
      await setDoc(doc(db, 'folders', newId), newFolder);
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
      await updateDoc(doc(db, 'folders', id), {
        name: name.trim(),
        color,
        icon,
        updatedAt: serverTimestamp(),
      });
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
    const notesInFolder = notes.filter((n) => n.folderId === id);
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
      await deleteDoc(doc(db, 'folders', id));
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
        loginWithGoogle,
        logout,
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
