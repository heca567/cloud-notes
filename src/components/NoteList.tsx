import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Trash2, 
  Plus, 
  FileText, 
  ArrowUpDown, 
  Folder as FolderIcon, 
  RotateCcw,
  Sparkles,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { FOLDER_ICONS } from './FolderModal';
import type { Note } from '../types';

interface NoteListProps {
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onCollapse: () => void;
}

type SortOption = 'updated' | 'title' | 'created';

export const NoteList: React.FC<NoteListProps> = ({
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebar,
  onCollapse,
}) => {
  const {
    notes,
    state,
    folders,
    setSelectedNoteId,
    setSearchQuery,
    createNote,
    deleteNote,
    restoreNote,
    togglePinNote,
    setMobileView,
  } = useNotes();
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Filter notes based on activeFilter
  let filteredNotes = notes.filter((note) => {
    if (state.activeFilter === 'trash') {
      return note.isArchived;
    }
    if (note.isArchived) return false;

    if (state.activeFilter === 'all') return true;
    if (state.activeFilter === 'pinned') return note.isPinned;
    if (state.activeFilter === 'unorganized') return !note.folderId;
    return note.folderId === state.activeFilter;
  });

  // Helpers
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Search filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter((n) => {
      const cleanContent = stripHtml(n.content).toLowerCase();
      return n.title.toLowerCase().includes(q) || cleanContent.includes(q);
    });
  }

  // Sort notes
  filteredNotes.sort((a, b) => {
    // In normal views, pinned notes are always on top
    if (state.activeFilter !== 'trash') {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    }

    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    
    // Sort by timestamp
    const getTime = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (val.seconds) return val.seconds * 1000;
      if (typeof val === 'number') return val;
      return new Date(val).getTime() || 0;
    };

    if (sortBy === 'created') {
      return getTime(b.createdAt) - getTime(a.createdAt);
    }
    return getTime(b.updatedAt) - getTime(a.updatedAt);
  });

  // Helpers
  const getFolderName = (folderId: string) => {
    const f = folders.find((item) => item.id === folderId);
    return f ? f.name : null;
  };

  const getFolderColor = (folderId: string) => {
    const f = folders.find((item) => item.id === folderId);
    return f ? f.color : '#94a3b8';
  };

  const formatDate = (val: any) => {
    if (!val) return '';
    let date: Date;
    if (typeof val.toDate === 'function') date = val.toDate();
    else if (val.seconds) date = new Date(val.seconds * 1000);
    else date = new Date(val);

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Strip rich text HTML and markdown formatting for snippet preview
  const getCleanSnippet = (content: string) => {
    if (!content) return 'Nota vacía...';
    const cleaned = stripHtml(content)
      .replace(/#+\s/g, '')
      .replace(/[*_~`>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/- \[[ xX]\]\s/g, '')
      .trim();
    return cleaned || 'Nota vacía...';
  };

  // Filter Title info
  const getCurrentHeader = () => {
    if (state.activeFilter === 'all') return { title: 'Todas las notas', icon: FileText, color: '#3b82f6' };
    if (state.activeFilter === 'pinned') return { title: 'Notas fijadas', icon: Pin, color: '#f59e0b' };
    if (state.activeFilter === 'unorganized') return { title: 'Sin carpeta', icon: FileText, color: '#94a3b8' };
    if (state.activeFilter === 'trash') return { title: 'Papelera', icon: Trash2, color: '#ef4444' };
    const folder = folders.find((f) => f.id === state.activeFilter);
    if (folder) {
      const Icon = FOLDER_ICONS[folder.icon] || FolderIcon;
      return { title: folder.name, icon: Icon, color: folder.color };
    }
    return { title: 'Notas', icon: FileText, color: '#3b82f6' };
  };

  const currentHeader = getCurrentHeader();
  const HeaderIcon = currentHeader.icon;

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Top search & mobile header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Abrir barra lateral"
            aria-label="Abrir barra lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {isSidebarCollapsed
                ? <PanelLeftOpen className="h-5 w-5" />
                : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={onCollapse}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Colapsar lista de notas"
              aria-label="Colapsar lista de notas"
            >
              <PanelRightClose className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentHeader.color }}
            />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {currentHeader.title}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {filteredNotes.length}
            </span>
          </div>

          {state.activeFilter !== 'trash' && (
            <button
              onClick={async () => {
                await createNote();
              }}
              className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-xs transition"
              title="Nueva nota"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {state.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Ordenar:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy('updated')}
              className={`px-2 py-0.5 rounded-md transition ${
                sortBy === 'updated'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Recientes
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-2 py-0.5 rounded-md transition ${
                sortBy === 'title'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              A-Z
            </button>
            <button
              onClick={() => setSortBy('created')}
              className={`px-2 py-0.5 rounded-md transition ${
                sortBy === 'created'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Creación
            </button>
          </div>
        </div>
      </div>

      {/* Notes cards list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {filteredNotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <HeaderIcon className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {state.searchQuery ? 'No hay notas que coincidan' : 'No hay notas aquí'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {state.searchQuery
                ? 'Prueba con otra palabra clave.' 
                : state.activeFilter === 'trash'
                ? 'La papelera está vacía.'
                : 'Crea una nueva nota para empezar a escribir.'}
            </p>
            {state.activeFilter !== 'trash' && !state.searchQuery && (
              <button
                onClick={async () => {
                  await createNote();
                }}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Crear nota
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = state.selectedNoteId === note.id;
            const folderName = getFolderName(note.folderId);
            const folderColor = getFolderColor(note.folderId);

            return (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setMobileView('editor');
                }}
                className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800/90 border-blue-500 shadow-md ring-2 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
                style={{
                  borderLeftColor: note.color && note.color !== '#ffffff' ? note.color : undefined,
                  borderLeftWidth: note.color && note.color !== '#ffffff' ? '4px' : undefined,
                }}
              >
                {/* Header row: title and pin/actions */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-semibold truncate leading-tight ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {note.title || 'Sin título'}
                  </h3>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pin button */}
                    {state.activeFilter !== 'trash' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNote(note.id);
                        }}
                        className={`p-1 rounded-lg transition ${
                          note.isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100'
                        }`}
                        title={note.isPinned ? 'Desfijar' : 'Fijar al inicio'}
                      >
                        <Pin className="w-3.5 h-3.5" fill={note.isPinned ? 'currentColor' : 'none'} />
                      </button>
                    )}

                    {/* Trash or Restore action */}
                    {state.activeFilter === 'trash' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreNote(note.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 transition"
                        title="Restaurar nota"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id, false);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                        title="Mover a papelera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content preview snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {getCleanSnippet(note.content)}
                </p>

                {/* Footer metadata: date & folder tag */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                  <span>{formatDate(note.updatedAt || note.createdAt)}</span>

                  {folderName ? (
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold truncate max-w-[120px]"
                      style={{
                        backgroundColor: `${folderColor}15`,
                        color: folderColor,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: folderColor }} />
                      <span className="truncate">{folderName}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Sin carpeta</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Floating Action Button to create a note */}
      {state.activeFilter !== 'trash' && (
        <button
          type="button"
          onClick={async () => {
            await createNote();
          }}
          className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/50 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Crear nueva nota"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
