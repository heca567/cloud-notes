import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Pin, 
  Trash2, 
  Folder as FolderIcon, 
  Download, 
  Copy, 
  Check, 
  Bold, 
  Italic, 
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List, 
  ListOrdered, 
  Quote, 
  Minus, 
  RotateCcw,
  RefreshCw,
  WifiOff,
  Palette,
  ChevronDown,
  ChevronLeft,
  RemoveFormatting,
  Heading1,
  Heading2,
  Heading3,
  Type
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { FOLDER_ICONS } from './FolderModal';
import EditorZone from './editor/EditorZone';

const NOTE_COLORS = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Ámbar suave', value: '#fef3c7' },
  { name: 'Esmeralda menta', value: '#d1fae5' },
  { name: 'Cielo azul', value: '#e0f2fe' },
  { name: 'Lavanda', value: '#ede9fe' },
  { name: 'Rosa suave', value: '#ffe4e6' },
  { name: 'Pizarra tenue', value: '#f1f5f9' },
];

export const NoteEditor: React.FC = () => {
  const {
    notes,
    folders,
    selectedNoteId,
    syncState,
    isOnline,
    updateNote,
    deleteNote,
    restoreNote,
    togglePinNote,
    createNote,
    setMobileView,
  } = useNotes();

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  // Active formatting state for toolbar button highlights
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    currentBlock: 'p',
  });

  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 1 });
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProp = useRef(false);

  // Helper to extract clean plain text from HTML
  const extractText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const updateStats = useCallback((html: string) => {
    const text = extractText(html).trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    setStats({ words, chars, readTime });
  }, []);

  // Update active formatting states from current selection
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;

    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strike = document.queryCommandState('strikeThrough');
      const bulletList = document.queryCommandState('insertUnorderedList');
      const orderedList = document.queryCommandState('insertOrderedList');
      const alignCenter = document.queryCommandState('justifyCenter');
      const alignRight = document.queryCommandState('justifyRight');
      const alignJustify = document.queryCommandState('justifyFull');
      const alignLeft = !alignCenter && !alignRight && !alignJustify;

      // Determine current block format
      let block = 'p';
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        while (node && node !== editorRef.current) {
          const tag = (node as HTMLElement).tagName?.toLowerCase();
          if (['h1', 'h2', 'h3', 'blockquote', 'p'].includes(tag)) {
            block = tag;
            break;
          }
          node = node.parentNode;
        }
      }

      setActiveFormats({
        bold,
        italic,
        underline,
        strike,
        bulletList,
        orderedList,
        alignLeft,
        alignCenter,
        alignRight,
        alignJustify,
        currentBlock: block,
      });
    } catch {
      // Ignore queryCommand errors if selection is outside
    }
  }, []);

  // Populate editor when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || '');
      if (editorRef.current) {
        isUpdatingFromProp.current = true;
        const initialHtml = activeNote.content || '';
        
        // Handle legacy plain text notes by wrapping in paragraph if not HTML
        if (initialHtml && !initialHtml.includes('<') && initialHtml.includes('\n')) {
          editorRef.current.innerHTML = initialHtml
            .split('\n')
            .map((line) => `<p>${line || '<br>'}</p>`)
            .join('');
        } else {
          editorRef.current.innerHTML = initialHtml;
        }

        updateStats(editorRef.current.innerHTML);
        isUpdatingFromProp.current = false;
      }
    } else {
      setTitle('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setStats({ words: 0, chars: 0, readTime: 1 });
    }
    updateActiveFormats();
  }, [activeNote?.id, updateActiveFormats, updateStats]);

  // Debounced auto-save function
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!activeNote) return;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        updateNote(activeNote.id, {
          title: newTitle || 'Sin título',
          content: newContent,
        });
      }, 400);
    },
    [activeNote, updateNote]
  );

  // Handle content changes inside editor
  const handleContentInput = () => {
    console.log("hanlde input")
    if (!editorRef.current || isUpdatingFromProp.current) return;
    const currentHtml = editorRef.current.innerHTML;
    updateStats(currentHtml);
    triggerSave(title, currentHtml);
  };

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : '';
    triggerSave(newTitle, currentHtml);
  };

  // Execute formatting command with immediate auto-save and focus retention
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateActiveFormats();
    handleContentInput();
  };

  // Copy to clipboard (copies plain text + HTML)
  const handleCopy = () => {
    if (!editorRef.current) return;
    const text = extractText(editorRef.current.innerHTML);
    navigator.clipboard.writeText(`${title}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export note to file
  const handleExport = (type: 'html' | 'txt') => {
    if (!editorRef.current) return;
    let blob: Blob;
    let ext: string;

    if (type === 'html') {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Nota'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    blockquote { border-left: 4px solid #3b82f6; margin: 16px 0; padding-left: 16px; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <h1>${title || 'Sin título'}</h1>
  ${editorRef.current.innerHTML}
</body>
</html>`;
      blob = new Blob([fullHtml], { type: 'text/html' });
      ext = 'html';
    } else {
      const text = `${title}\n\n${extractText(editorRef.current.innerHTML)}`;
      blob = new Blob([text], { type: 'text/plain' });
      ext = 'txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'nota').replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const currentFolder = folders.find((f) => f.id === activeNote.folderId);
  const CurrentFolderIcon = currentFolder ? FOLDER_ICONS[currentFolder.icon] || FolderIcon : FolderIcon;

  const blockLabels: Record<string, string> = {
    p: 'Párrafo',
    h1: 'Título grande (H1)',
    h2: 'Título mediano (H2)',
    h3: 'Subtítulo (H3)',
    blockquote: 'Cita en bloque',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden select-text">
      {/* Top Banner if in Trash */}
      {activeNote.isArchived && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <span>Esta nota está en la papelera.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => restoreNote(activeNote.id)}
              className="px-3 py-1 font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              Restaurar nota
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Eliminar permanentemente esta nota? Esta acción no se puede deshacer.')) {
                  deleteNote(activeNote.id, true);
                }
              }}
              className="px-3 py-1 font-semibold rounded-lg border border-rose-400/40 hover:bg-rose-500/20 transition"
            >
              Eliminar definitivamente
            </button>
          </div>
        </div>
      )}

      {/* Editor Top Navigation Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Back to Notes button */}
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="md:hidden px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-xs font-semibold shrink-0 transition cursor-pointer"
            title="Volver a la lista de notas"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Notas</span>
          </button>

          {/* Folder selector pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFolderMenu(!showFolderMenu);
                setShowColorMenu(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 transition"
            >
              <CurrentFolderIcon
                className="w-3.5 h-3.5"
                style={{ color: currentFolder ? currentFolder.color : '#94a3b8' }}
              />
              <span className="max-w-[130px] truncate">
                {currentFolder ? currentFolder.name : 'Sin carpeta'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Folder Dropdown */}
            {showFolderMenu && (
              <div 
                className="absolute left-0 top-10 z-30 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Mover a carpeta
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateNote(activeNote.id, { folderId: '' });
                    setShowFolderMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                    !activeNote.folderId ? 'text-blue-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <FolderIcon className="w-4 h-4 text-slate-400" />
                  <span>Sin carpeta</span>
                </button>

                {folders.map((f) => {
                  const Icon = FOLDER_ICONS[f.icon] || FolderIcon;
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => {
                        updateNote(activeNote.id, { folderId: f.id });
                        setShowFolderMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                        activeNote.folderId === f.id ? 'text-blue-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" style={{ color: f.color }} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color palette selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(!showColorMenu);
                setShowFolderMenu(false);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Color de tarjeta"
            >
              <Palette className="w-4 h-4" />
            </button>

            {showColorMenu && (
              <div 
                className="absolute left-0 top-10 z-30 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {NOTE_COLORS.map((col) => (
                  <button
                    key={col.value}
                    onClick={() => {
                      updateNote(activeNote.id, { color: col.value });
                      setShowColorMenu(false);
                    }}
                    style={{ backgroundColor: col.value }}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition flex items-center justify-center"
                    title={col.name}
                  >
                    {activeNote.color === col.value && <Check className="w-3 h-3 text-slate-800 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <button
            type="button"
            onClick={() => togglePinNote(activeNote.id)}
            className={`p-2 rounded-xl transition ${
              activeNote.isPinned
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={activeNote.isPinned ? 'Desfijar de la parte superior' : 'Fijar nota'}
          >
            <Pin className="w-4 h-4" fill={activeNote.isPinned ? 'currentColor' : 'none'} />
          </button>

          {/* Trash button */}
          {!activeNote.isArchived && (
            <button
              type="button"
              onClick={() => deleteNote(activeNote.id, false)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Mover a papelera"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side controls: Real-time sync status & export */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync indicator pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {syncState === 'saving' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-600 dark:text-amber-400">Guardando en la nube...</span>
              </>
            ) : isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Guardado en la nube</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="text-red-500">Sin conexión</span>
              </>
            )}
          </div>

          {/* Copy content button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Copiar texto de la nota"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handleExport('html')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
              title="Descargar nota"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RICH TEXT FORMATTING TOOLBAR */}
      <div 
        className="px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center gap-1 overflow-x-auto text-slate-600 dark:text-slate-300 shrink-0 select-none scrollbar-none"
        onMouseDown={(e) => {
          // Keep editor selection active when clicking toolbar empty space
          if ((e.target as HTMLElement).tagName !== 'BUTTON') {
            e.preventDefault();
          }
        }}
      >
        {/* Paragraph / Heading Block Selector */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowBlockMenu(!showBlockMenu);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            title="Estilo de párrafo o encabezado"
          >
            <span>{blockLabels[activeFormats.currentBlock] || 'Párrafo'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBlockMenu && (
            <div 
              className="absolute left-0 top-9 z-40 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs animate-in fade-in"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeFormat('formatBlock', '<p>');
                  setShowBlockMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  activeFormats.currentBlock === 'p' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Párrafo normal</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeFormat('formatBlock', '<h1>');
                  setShowBlockMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  activeFormats.currentBlock === 'h1' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                <Heading1 className="w-3.5 h-3.5" />
                <span className="font-bold text-sm">Título grande (H1)</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeFormat('formatBlock', '<h2>');
                  setShowBlockMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  activeFormats.currentBlock === 'h2' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                <Heading2 className="w-3.5 h-3.5" />
                <span className="font-semibold text-xs">Título mediano (H2)</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeFormat('formatBlock', '<h3>');
                  setShowBlockMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  activeFormats.currentBlock === 'h3' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                <Heading3 className="w-3.5 h-3.5" />
                <span>Subtítulo (H3)</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeFormat('formatBlock', '<blockquote>');
                  setShowBlockMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  activeFormats.currentBlock === 'blockquote' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span className="italic">Cita en bloque</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Inline styles: Negrita, Cursiva, Subrayado, Tachado */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('bold');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.bold
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('italic');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.italic
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('underline');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.underline
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Subrayado (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('strikeThrough');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.strike
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Text Alignment Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('justifyLeft');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.alignLeft
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('justifyCenter');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.alignCenter
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('justifyRight');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.alignRight
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('justifyFull');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.alignJustify
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Justificar texto"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* List Controls: Con viñetas y numeradas */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('insertUnorderedList');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.bulletList
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('insertOrderedList');
            }}
            className={`p-1.5 rounded-lg transition ${
              activeFormats.orderedList
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Additional formatting: Cita, Separador horizontal, Limpiar formato */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('formatBlock', '<blockquote>');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Cita en bloque"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('insertHorizontalRule');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Insertar línea divisoria"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeFormat('removeFormat');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="Eliminar formato"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      </div>

      <EditorZone
        editorRef={editorRef}
        title={title}
        handleTitleChange={handleTitleChange}
        handleContentInput={handleContentInput}
        updateActiveFormats={updateActiveFormats}
      />

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
