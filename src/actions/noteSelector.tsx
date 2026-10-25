import { createContext, useState } from "react"

export const selectNoteStatus = (noteSyncStates: Record<string, any>): string => {
  const statuses = Object.values(noteSyncStates);
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('saving')) return 'saving';
  return 'synced';
};

export const NoteContext = createContext<any>(null);

export const NoteSelectorProvider = ({ children }: { children: React.ReactNode }) => {
  const [notesStatus, setNotesStatus] = useState<Record<string, any>>({});
  return (
    <NoteContext.Provider value={{ notesStatus, setNotesStatus, selectNoteStatus }}>
      {children}
    </NoteContext.Provider>
  );
}



