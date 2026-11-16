import React from 'react';
import { EditorContent } from '@tiptap/react';
import { 
  Type,
  Info,
  X,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { EditorToolbar } from './EditorToolbar';
import { NoteHeader } from './NoteHeader';
import { useEditor } from '../features/editor/useEditor';

interface NoteEditorProps {
  isNoteListCollapsed: boolean;
  onToggleNoteList: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isNoteListCollapsed,
  onToggleNoteList,
}) => {
  const {
    notes,
    state,
    folders,
    updateNote,
    deleteNote,
    restoreNote,
    togglePinNote,
    createNote,
    setMobileView,
  } = useNotes();
  const activeNote = notes.find((n) => n.id === state.selectedNoteId);

  const {
    editorState,
    title,
    copied,
    activeFormats,
    stats,
    showFolderMenu,
    showColorMenu,
    showBlockMenu,
    showEditorState,
    editor,
    canUndo,
    undo,
    handleTitleChange,
    executeFormat,
    handleCopy,
    handleExport,
    toggleFolderMenu,
    closeFolderMenu,
    toggleColorMenu,
    closeColorMenu,
    toggleBlockMenu,
    closeBlockMenu,
    toggleEditorState,
  } = useEditor(activeNote, updateNote);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Type className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Ninguna nota seleccionada
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
          Selecciona una nota de la lista o crea una nueva para comenzar a escribir con texto enriquecido.
        </p>
        <button
          onClick={() => createNote()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-sm cursor-pointer"
        >
          Crear nueva nota
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden select-text">
      <NoteHeader
        note={activeNote}
        folders={folders}
        isOnline={state.isOnline}
        syncState={state.syncState}
        isNoteListCollapsed={isNoteListCollapsed}
        copied={copied}
        showFolderMenu={showFolderMenu}
        showColorMenu={showColorMenu}
        onToggleNoteList={onToggleNoteList}
        onSetMobileView={setMobileView}
        onRestore={restoreNote}
        onDelete={deleteNote}
        onUpdate={updateNote}
        onTogglePin={togglePinNote}
        onCopy={handleCopy}
        onExport={handleExport}
        onToggleFolderMenu={toggleFolderMenu}
        onCloseFolderMenu={closeFolderMenu}
        onToggleColorMenu={toggleColorMenu}
        onCloseColorMenu={closeColorMenu}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <EditorToolbar
          activeFormats={activeFormats}
          canUndo={canUndo}
          executeFormat={executeFormat}
          onUndo={undo}
          showBlockMenu={showBlockMenu}
          toggleBlockMenu={toggleBlockMenu}
          closeBlockMenu={closeBlockMenu}
        />

      {/* Editor Content Surface */}
      <div 
        className="flex min-h-full flex-col p-4 sm:p-8 cursor-text"
        onClick={(event) => {
          if (event.target === event.currentTarget && editor && !editor.isFocused) {
            editor.commands.focus();
          }
        }}
        onTouchEnd={(e) => {
          if (e.target === e.currentTarget && editor) {
            editor.commands.focus();
          }
        }}
      >
        {/* Note Title Input */}
        <input
          type="text"
          placeholder="Título de la nota..."
          value={title}
          maxLength={200}
          onChange={handleTitleChange}
          className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 border-none outline-hidden bg-transparent mb-3 sm:mb-4 tracking-tight shrink-0"
        />

        <EditorContent
          editor={editor}
          className="flex-1 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-sans
            [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:pb-36 [&_.ProseMirror]:outline-hidden
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:my-3 [&_h1]:pb-1 [&_h1]:border-b [&_h1]:border-slate-200 dark:[&_h1]:border-slate-800
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2.5 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-slate-200 dark:[&_h2]:border-slate-800
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2
            [&_p]:my-1.5
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
            [&_li]:my-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400
            [&_hr]:my-4 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800
            [&_b]:font-bold [&_strong]:font-bold
            [&_i]:italic [&_em]:italic
            [&_u]:underline
            [&_strike]:line-through
          "
        />
      </div>

      </div>

      <div className="absolute bottom-14 right-4 z-50 flex flex-col items-end gap-2">
        {showEditorState && (
          <section
            id="editor-state-panel"
            aria-label="Estado interno del editor"
            className="w-[min(22rem,calc(100vw-2rem))] max-h-[min(70vh,32rem)] overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Estado del editor
            </h2>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">showEditorState</dt>
                <dd className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(editorState.showEditorState)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">title</dt>
                <dd className="break-words rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(title)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">copied</dt>
                <dd className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(copied)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">showFolderMenu</dt>
                <dd className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(showFolderMenu)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">showColorMenu</dt>
                <dd className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(showColorMenu)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">showBlockMenu</dt>
                <dd className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(showBlockMenu)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">activeFormats</dt>
                <dd>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {JSON.stringify(activeFormats, null, 2)}
                  </pre>
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium text-slate-500 dark:text-slate-400">stats</dt>
                <dd>
                  <pre className="rounded-md bg-slate-50 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </dd>
              </div>
            </dl>
          </section>
        )}
        <button
          type="button"
          aria-expanded={showEditorState}
          aria-controls="editor-state-panel"
          aria-label={showEditorState ? 'Ocultar estado del editor' : 'Mostrar estado del editor'}
          onClick={(event) => {
            event.stopPropagation();
            toggleEditorState();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {showEditorState ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
        </button>
      </div>

      {/* Bottom Metadata & Statistics Bar */}
      <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 text-xs text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span>{stats.words} palabras</span>
          <span>{stats.chars} caracteres</span>
          <span className="hidden sm:inline">~{stats.readTime} min de lectura</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            Formato de texto enriquecido activo
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden md:inline">Sincronizado con Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
