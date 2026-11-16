import React, { useEffect } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { AuthProvider } from '../auth/auth';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { AuthScreen } from './components/AuthScreen';
import { Cloud, Loader2, PanelRightOpen } from 'lucide-react';
import { useApp } from './lib/useApp';
import { AppProvider } from './context/AppContext';
const Workspace: React.FC = () => {
  const {
    state,
    createNote,
    setMobileSidebarOpen,
    toggleSidebarCollapsed,
    toggleNoteListCollapsed,
    setNoteListCollapsed,
  } = useNotes();
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

  if (state.authLoading) {
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

  if (!state.logged) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Sidebar with Folders and Navigation */}
      <Sidebar
        isMobileOpen={state.isMobileSidebarOpen}
        setIsMobileOpen={setMobileSidebarOpen}
        isDesktopCollapsed={state.isSidebarCollapsed}
        onToggleDesktop={toggleSidebarCollapsed}
      />
      {/* Note List column: on mobile, show if mobileView === 'list', hide if mobileView === 'editor' */}
      <div className={`h-full ${
        state.mobileView === 'editor'
          ? (state.isNoteListCollapsed ? 'hidden' : 'hidden md:flex md:w-80 lg:w-96')
          : `flex w-full ${state.isNoteListCollapsed ? 'md:hidden' : 'md:w-80 lg:w-96'}`
      } shrink-0`}>
        <NoteList
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapsed}
          onCollapse={() => setNoteListCollapsed(true)}
        />
      </div>
      {state.isNoteListCollapsed && (
        <div className={`hidden h-full w-12 shrink-0 flex-col items-center border-r border-slate-200 bg-slate-50 pt-3 dark:border-slate-800 dark:bg-slate-900/40 md:flex ${
          state.mobileView === 'editor' ? 'md:hidden' : ''
        }`}>
          <button
            type="button"
            onClick={() => setNoteListCollapsed(false)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Expandir lista de notas"
            aria-label="Expandir lista de notas"
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Note Editor Surface: on mobile, show if mobileView === 'editor', hide if mobileView === 'list' */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${state.mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        <NoteEditor
          isNoteListCollapsed={state.isNoteListCollapsed}
          onToggleNoteList={toggleNoteListCollapsed}
        />
      </main>
    </div>
  );
};

export default function App() {
  
  return (
    <AppProvider>
    <AuthProvider>
      <NotesProvider>
        <Workspace />
      </NotesProvider>
    </AuthProvider>
    </AppProvider>
  );
}
