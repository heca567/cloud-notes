import React, { useState, useEffect, useContext } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { AuthProvider } from '../auth/auth';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { AuthScreen } from './components/AuthScreen';
import { Cloud, Loader2 } from 'lucide-react';
import { NoteContext, NoteSelectorProvider } from './actions/noteSelector';

const Workspace: React.FC = () => {
  const { user, authLoading, createNote, mobileView } = useNotes();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const value = useContext(NoteContext);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+N or Alt+N to create new note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-500/30 animate-pulse">
          <Cloud className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Conectando con la nube...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Sidebar with Folders and Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Note List column: on mobile, show if mobileView === 'list', hide if mobileView === 'editor' */}
      <div className={`h-full ${mobileView === 'editor' ? 'hidden md:flex' : 'flex w-full md:w-80 lg:w-96'} shrink-0`}>
        <div>El estado de las notas es</div>
        <pre>{JSON.stringify(value.notesStatus, null, 2)}</pre>
        <NoteList
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      </div>

      {/* Note Editor Surface: on mobile, show if mobileView === 'editor', hide if mobileView === 'list' */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        <NoteEditor />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <NoteSelectorProvider>
          <Workspace />
        </NoteSelectorProvider>
      </NotesProvider>
    </AuthProvider>
  );
}
