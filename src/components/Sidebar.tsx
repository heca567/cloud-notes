import React, { useState } from 'react';
import { 
  FileText, 
  FolderPlus, 
  Pin, 
  Trash2, 
  Cloud, 
  Inbox, 
  MoreVertical, 
  Plus, 
  LogOut, 
  Edit2, 
  Trash, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  ChevronRight,
  PanelLeftClose,
  Folder as DefaultFolderIcon,
  X,
  LogIn
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../../auth/auth';
import { FOLDER_ICONS, FolderModal } from './FolderModal';
import { SyncDevicesModal } from './SyncDevicesModal';
import type { Folder } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopCollapsed: boolean;
  onToggleDesktop: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  onToggleDesktop,
}) => {
  const {
    notes,
    state,
    folders,
    setActiveFilter,
    setMobileView,
    createNote,
    createFolder,
    updateFolder,
    deleteFolder,
    logout,
  } = useNotes();
  const { logSession, session } = useAuth();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null);

  // Counts
  const activeNotes = notes.filter((n) => !n.isArchived);
  const totalActive = activeNotes.length;
  const unorganizedCount = activeNotes.filter((n) => !n.folderId).length;
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length;
  const trashCount = notes.filter((n) => n.isArchived).length;

  const handleSelectFilter = (filter: string) => {
    setActiveFilter(filter);
    setMobileView('list');
    setIsMobileOpen(false);
  };

  const handleCreateNewNote = async () => {
    await createNote();
    setMobileView('editor');
    setIsMobileOpen(false);
  };

  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderMenuOpenId(null);
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderMenuOpenId(null);
    if (window.confirm(`¿Eliminar la carpeta "${folder.name}"? Las notas se moverán a "Sin carpeta".`)) {
      await deleteFolder(folder.id, true);
    }
  };

  const handleSaveFolder = async (name: string, color: string, icon: string) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, name, color, icon);
    } else {
      await createFolder(name, color, icon);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-200 flex flex-col transition-[transform,width,opacity] duration-300 ease-in-out border-r border-slate-800 overflow-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isDesktopCollapsed ? 'md:w-0 md:border-r-0 md:opacity-0 md:pointer-events-none' : 'md:w-72'}`}
      >
        {/* App Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                CloudNotes
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Nube
                </span>
              </h1>
              <p className="text-xs text-slate-400">Sincronización en vivo</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggleDesktop}
            className="hidden md:block p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Colapsar barra lateral"
            aria-label="Colapsar barra lateral"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Pill */}
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {state.syncState === 'saving' ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                ) : state.isOnline ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                )}
                {state.syncState === 'saving' && <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>}
              </span>
              <span className="text-slate-300 font-medium">
                {state.syncState === 'saving' ? 'Guardando cambios...' : state.isOnline ? 'Nube sincronizada' : 'Sin conexión'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-400">
              {state.isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Action: New Note Button */}
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva nota</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin">
          {/* Main items */}
          <div className="space-y-1">
            <button
              onClick={() => handleSelectFilter('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                state.activeFilter === 'all'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Todas las notas</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {totalActive}
              </span>
            </button>

            <button
              onClick={() => handleSelectFilter('pinned')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                state.activeFilter === 'pinned'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Pin className="w-4 h-4 text-amber-400" />
                <span>Fijadas</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {pinnedCount}
              </span>
            </button>

            <button
              onClick={() => handleSelectFilter('unorganized')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                state.activeFilter === 'unorganized'
                  ? 'bg-slate-700/60 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4 text-slate-400" />
                <span>Sin carpeta</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {unorganizedCount}
              </span>
            </button>

            <button
              onClick={() => handleSelectFilter('trash')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                state.activeFilter === 'trash'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Papelera</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {trashCount}
              </span>
            </button>

            {/* Log Session Button (usa useAuth) */}
            <button
              type="button"
              onClick={() => logSession()}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300 border border-emerald-500/20 active:scale-[0.98] cursor-pointer"
              title="Guardar sesión con useAuth y el observador"
            >
              <div className="flex items-center gap-3 truncate">
                <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{session?.isAuthenticated ? 'Sesión: Abraham' : 'Log Session'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                {session?.isAuthenticated ? 'Activa' : 'useAuth'}
              </span>
            </button>
          </div>

          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Carpetas en la nube</span>
              <button
                type="button"
                onClick={handleOpenNewFolder}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Crear nueva carpeta"
              >
                <FolderPlus className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {folders.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-xl border border-dashed border-slate-800 text-slate-400">
                <p className="text-xs">No tienes carpetas aún</p>
                <button
                  type="button"
                  onClick={handleOpenNewFolder}
                  className="mt-2 text-xs text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Crear primera carpeta
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => {
                  const count = activeNotes.filter((n) => n.folderId === folder.id).length;
                  const IconComp = FOLDER_ICONS[folder.icon] || DefaultFolderIcon;
                  const isSelected = state.activeFilter === folder.id;

                  return (
                    <div key={folder.id} className="relative group">
                      <button
                        onClick={() => handleSelectFilter(folder.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                          isSelected
                            ? 'bg-slate-800 text-white font-semibold border-l-4'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                        style={{ borderLeftColor: isSelected ? folder.color : 'transparent' }}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: folder.color }}
                          />
                          <IconComp className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                          <span className="truncate">{folder.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuOpenId(folderMenuOpenId === folder.id ? null : folder.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition"
                            title="Opciones de carpeta"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>

                      {/* Folder options popup */}
                      {folderMenuOpenId === folder.id && (
                        <div 
                          className="absolute right-2 top-8 z-30 w-44 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleEditFolder(folder, e)}
                            className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Editar carpeta</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder, e)}
                            className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                          >
                            <Trash className="w-3.5 h-3.5 text-rose-400" />
                            <span>Eliminar carpeta</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User profile & cloud sync footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-800/40">
            <div className="flex items-center gap-2.5 truncate">
              {state.logged?.photoURL ? (
                <img
                  src={state.logged.photoURL}
                  alt={state.logged.displayName || 'Usuario'}
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {state.logged?.displayName ? state.logged.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {state.logged?.displayName || 'Usuario'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {state.logged?.email || 'Conectado'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleSaveFolder}
        editingFolder={editingFolder}
      />

      <SyncDevicesModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </>
  );
};
