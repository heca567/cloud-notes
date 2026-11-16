import {
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  Folder as FolderIcon,
  Palette,
  PanelLeftOpen,
  Pin,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import type { Folder, Note } from "../types";
import { FOLDER_ICONS } from "./FolderModal";

const NOTE_COLORS = [
  { name: "Blanco", value: "#ffffff" },
  { name: "Ámbar suave", value: "#fef3c7" },
  { name: "Esmeralda menta", value: "#d1fae5" },
  { name: "Cielo azul", value: "#e0f2fe" },
  { name: "Lavanda", value: "#ede9fe" },
  { name: "Rosa suave", value: "#ffe4e6" },
  { name: "Pizarra tenue", value: "#f1f5f9" },
];

interface NoteHeaderProps {
  note: Note;
  folders: Folder[];
  isOnline: boolean;
  syncState: "synced" | "saving" | "offline" | "error";
  isNoteListCollapsed: boolean;
  copied: boolean;
  showFolderMenu: boolean;
  showColorMenu: boolean;
  onToggleNoteList: () => void;
  onSetMobileView: (view: "list" | "editor") => void;
  onRestore: (id: string) => void;
  onDelete: (id: string, permanent?: boolean) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onTogglePin: (id: string) => void;
  onCopy: () => void;
  onExport: (type: "html" | "txt") => void;
  onToggleFolderMenu: () => void;
  onCloseFolderMenu: () => void;
  onToggleColorMenu: () => void;
  onCloseColorMenu: () => void;
}

export const NoteHeader = ({
  note,
  folders,
  isOnline,
  syncState,
  isNoteListCollapsed,
  copied,
  showFolderMenu,
  showColorMenu,
  onToggleNoteList,
  onSetMobileView,
  onRestore,
  onDelete,
  onUpdate,
  onTogglePin,
  onCopy,
  onExport,
  onToggleFolderMenu,
  onCloseFolderMenu,
  onToggleColorMenu,
  onCloseColorMenu,
}: NoteHeaderProps) => {
  const currentFolder = folders.find((folder) => folder.id === note.folderId);
  const CurrentFolderIcon = currentFolder
    ? FOLDER_ICONS[currentFolder.icon] || FolderIcon
    : FolderIcon;

  return (
    <>
      {note.isArchived && (
        <div className="flex items-center justify-between border-b border-rose-500/20 bg-rose-500/10 px-6 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <span>Esta nota está en la papelera.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRestore(note.id)}
              className="rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white transition hover:bg-rose-700"
            >
              Restaurar nota
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Eliminar permanentemente esta nota? Esta acción no se puede deshacer.")) {
                  onDelete(note.id, true);
                }
              }}
              className="rounded-lg border border-rose-400/40 px-3 py-1 font-semibold transition hover:bg-rose-500/20"
            >
              Eliminar definitivamente
            </button>
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {isNoteListCollapsed && (
            <button
              type="button"
              onClick={onToggleNoteList}
              className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:flex"
              title="Expandir lista de notas"
              aria-label="Expandir lista de notas"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onSetMobileView("list")}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
            title="Volver a la lista de notas"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Notas</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={onToggleFolderMenu}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-700"
              aria-expanded={showFolderMenu}
            >
              <CurrentFolderIcon
                className="h-3.5 w-3.5"
                style={{ color: currentFolder ? currentFolder.color : "#94a3b8" }}
              />
              <span className="max-w-[130px] truncate">
                {currentFolder ? currentFolder.name : "Sin carpeta"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showFolderMenu && (
              <div
                className="absolute left-0 top-10 z-30 w-56 rounded-2xl border border-slate-200 bg-white py-1.5 text-xs shadow-xl animate-in fade-in dark:border-slate-700 dark:bg-slate-800"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Mover a carpeta
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate(note.id, { folderId: "" });
                    onCloseFolderMenu();
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    !note.folderId ? "font-semibold text-blue-600" : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <FolderIcon className="h-4 w-4 text-slate-400" />
                  <span>Sin carpeta</span>
                </button>
                {folders.map((folder) => {
                  const Icon = FOLDER_ICONS[folder.icon] || FolderIcon;
                  return (
                    <button
                      type="button"
                      key={folder.id}
                      onClick={() => {
                        onUpdate(note.id, { folderId: folder.id });
                        onCloseFolderMenu();
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        note.folderId === folder.id
                          ? "font-semibold text-blue-600"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" style={{ color: folder.color }} />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={onToggleColorMenu}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Color de tarjeta"
              aria-expanded={showColorMenu}
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorMenu && (
              <div
                className="absolute left-0 top-10 z-30 flex gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                onClick={(event) => event.stopPropagation()}
              >
                {NOTE_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => {
                      onUpdate(note.id, { color: color.value });
                      onCloseColorMenu();
                    }}
                    style={{ backgroundColor: color.value }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 transition hover:scale-110 dark:border-slate-600"
                    title={color.name}
                    aria-label={`Cambiar color: ${color.name}`}
                  >
                    {note.color === color.value && (
                      <Check className="h-3 w-3 stroke-[3] text-slate-800" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            className={`rounded-xl p-2 transition ${
              note.isPinned
                ? "bg-amber-50 text-amber-500 dark:bg-amber-950/40"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
            title={note.isPinned ? "Desfijar de la parte superior" : "Fijar nota"}
          >
            <Pin className="h-4 w-4" fill={note.isPinned ? "currentColor" : "none"} />
          </button>

          {!note.isArchived && (
            <button
              type="button"
              onClick={() => onDelete(note.id, false)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
              title="Mover a papelera"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {syncState === "saving" ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Guardando en la nube...</span>
              </>
            ) : isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Guardado en la nube</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Sin conexión</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onCopy}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Copiar texto de la nota"
            aria-label="Copiar texto de la nota"
          >
            {copied
              ? <Check className="h-4 w-4 text-emerald-500" />
              : <Copy className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onExport("html")}
            className="flex items-center gap-1 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Descargar nota"
            aria-label="Descargar nota"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};
