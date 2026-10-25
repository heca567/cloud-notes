import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Folder, Note } from "../types";
import { db } from "../firebase";

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}



export const createNewNote = (folderId: string, userID: string): Note => {
  const newId = generateId();
  const newNote: Note = {
    id: newId,
    userId: userID,
    folderId: folderId ? folderId : '',
    title: 'Nueva nota',
    content: '',
    isPinned: false,
    isArchived: false,
    color: '#ffffff',
    tags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return newNote;
};

export const addNoteToFirestore = async (note: Note): Promise<void> => {
  const path = `notes/${note.id}`;
  try {
    await setDoc(doc(db, path), note);
  } catch (error) {
    console.error("Error adding note to Firestore:", error);
    throw error;
  }
};

export const updateNoteInFirestore = async (id: string, updatedNote: Partial<Note>): Promise<void> => {
  const path = `notes/${id}`;
  try {
    await updateDoc(doc(db, 'notes', id), {
      ...updatedNote,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating note in Firestore:", error);
    throw error;
  }
};

export const deleteNoteFromFirestore = async (id: string): Promise<void> => {
  const path = `notes/${id}`;
  try {
    await deleteDoc(doc(db, 'notes', id));
  } catch (error) {
    console.error("Error deleting note from Firestore:", error);
    throw error;
  }
};

export const findNoteById = (notes: Note[], id: string): Note | undefined => {
  return notes.find(note => note.id === id);
}

export const createNewFolder = async (name: string, color = '#3b82f6', icon = 'folder', userID: string, newId: string): Promise<string> => {
  const newFolder: Folder = {
    id: newId,
    userId: userID,
    name: name.trim() || 'Nueva Carpeta',
    color,
    icon,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'folders', newId), newFolder);
  return newId;
};

export const updateFolderInFirestore = async (id: string, updatedFolder: Partial<Folder>): Promise<void> => {
  const { name, color, icon } = updatedFolder; // Destructure to ensure we don't accidentally overwrite the entire folder
  try {
    await updateDoc(doc(db, 'folders', id), {
      name: name?.trim(),
      color,
      icon,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating folder in Firestore:", error);
    throw error;
  }
};

export const findNoteInFolder = (notes: Note[], folderId: string): Note[] => {
  return notes.filter(note => note.folderId === folderId);
};

export const deleteFolderFromFirestore = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'folders', id));
  } catch (error) {
    console.error("Error deleting folder from Firestore:", error);
    throw error;
  }
};