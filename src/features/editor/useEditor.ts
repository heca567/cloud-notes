import { useCallback, useEffect, useReducer, useRef, useState, type ChangeEvent } from "react";
import { useEditor as useTiptapEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Note } from "../../types";
import { editorReducer, INITIAL_EDITOR_STATE } from "./editorState";
import type { ActiveFormats, EditorStats } from "./editorTypes";
import {
    calculateEditorStats,
    copyNote,
    EDITOR_EXTENSIONS,
    executeEditorCommand,
    exportNote,
    readActiveFormats,
} from "./editorService";

type UpdateNote = (id: string, updates: Partial<Note>) => Promise<void>;
type EditorHandler = (editor: TiptapEditor) => void;

interface PendingSave {
    noteId: string;
    title: string;
    content: string;
}

const INITIAL_ACTIVE_FORMATS: ActiveFormats = {
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
    currentBlock: "p",
};

const INITIAL_STATS: EditorStats = { words: 0, chars: 0, readTime: 1 };

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    })[character] ?? character);
}

function getInitialContent(content: string): string {
    if (content && !content.includes("<") && content.includes("\n")) {
        return content
            .split("\n")
            .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
            .join("");
    }

    return content;
}

export const useEditor = (
    activeNote: Note | undefined,
    updateNote: UpdateNote,
) => {
    const [uiState, dispatch] = useReducer(editorReducer, INITIAL_EDITOR_STATE);
    const [title, setTitle] = useState(activeNote?.title || "");
    const [stats, setStats] = useState(INITIAL_STATS);
    const [activeFormats, setActiveFormats] = useState(INITIAL_ACTIVE_FORMATS);
    const [canUndo, setCanUndo] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<PendingSave | null>(null);
    const isUpdatingFromProp = useRef(false);
    const onUpdateRef = useRef<EditorHandler>(() => {});
    const onSelectionUpdateRef = useRef<EditorHandler>(() => {});
    const onTransactionRef = useRef<EditorHandler>(() => {});

    const editor = useTiptapEditor({
        extensions: EDITOR_EXTENSIONS,
        content: "",
        onUpdate: ({ editor: currentEditor }) => onUpdateRef.current(currentEditor),
        onSelectionUpdate: ({ editor: currentEditor }) =>
            onSelectionUpdateRef.current(currentEditor),
        onTransaction: ({ editor: currentEditor }) => onTransactionRef.current(currentEditor),
    });

    const flushPendingSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        const pendingSave = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (!pendingSave) return;

        void updateNote(pendingSave.noteId, {
            title: pendingSave.title || "Sin título",
            content: pendingSave.content,
        });
    }, [updateNote]);

    const triggerSave = useCallback((noteId: string, newTitle: string, newContent: string) => {
        pendingSaveRef.current = {
            noteId,
            title: newTitle,
            content: newContent,
        };
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(flushPendingSave, 2000);
    }, [flushPendingSave]);

    const handleContentInput = useCallback((currentEditor: TiptapEditor) => {
        if (isUpdatingFromProp.current || !activeNote) return;
        setStats(calculateEditorStats(currentEditor));
        triggerSave(activeNote.id, title, currentEditor.getHTML());
    }, [activeNote, title, triggerSave]);

    const updateActiveFormats = useCallback((currentEditor: TiptapEditor) => {
        setActiveFormats(readActiveFormats(currentEditor));
    }, []);

    onUpdateRef.current = handleContentInput;
    onSelectionUpdateRef.current = updateActiveFormats;
    onTransactionRef.current = (currentEditor) => setCanUndo(currentEditor.can().undo());

    useEffect(() => {
        if (!editor) return;

        isUpdatingFromProp.current = true;
        try {
            if (activeNote) {
                setTitle(activeNote.title || "");
                editor.commands.setContent(getInitialContent(activeNote.content || ""), {
                    emitUpdate: false,
                });
                setStats(calculateEditorStats(editor));
            } else {
                setTitle("");
                editor.commands.clearContent(false);
                setStats(INITIAL_STATS);
            }
        } finally {
            isUpdatingFromProp.current = false;
        }
        setActiveFormats(readActiveFormats(editor));
    }, [activeNote?.id, editor]);

    useEffect(() => () => {
        flushPendingSave();
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    }, [flushPendingSave]);

    const handleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        if (activeNote && editor) {
            triggerSave(activeNote.id, newTitle, editor.getHTML());
        }
    }, [activeNote, editor, triggerSave]);

    const executeFormat = useCallback((command: string, value?: string | number) => {
        if (!editor) return;
        executeEditorCommand(editor, command, value);
        setActiveFormats(readActiveFormats(editor));
    }, [editor]);

    const undo = useCallback(() => {
        if (!editor?.can().undo()) return;
        editor.chain().focus().undo().run();
    }, [editor]);

    const handleCopy = useCallback(() => {
        if (!editor) return;
        void copyNote(title, editor).then(() => {
            dispatch({ type: "SET_COPIED", payload: true });
            if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
            copiedTimeoutRef.current = setTimeout(() => {
                dispatch({ type: "SET_COPIED", payload: false });
            }, 2000);
        });
    }, [editor, title]);

    const handleExport = useCallback((type: "html" | "txt") => {
        if (!editor) return;
        exportNote(title, editor, type);
    }, [editor, title]);

    const toggleFolderMenu = useCallback(() => {
        dispatch({ type: "TOGGLE_FOLDER_MENU" });
    }, []);
    const closeFolderMenu = useCallback(() => {
        dispatch({ type: "CLOSE_FOLDER_MENU" });
    }, []);
    const toggleColorMenu = useCallback(() => {
        dispatch({ type: "TOGGLE_COLOR_MENU" });
    }, []);
    const closeColorMenu = useCallback(() => {
        dispatch({ type: "CLOSE_COLOR_MENU" });
    }, []);
    const toggleBlockMenu = useCallback(() => {
        dispatch({ type: "TOGGLE_BLOCK_MENU" });
    }, []);
    const closeBlockMenu = useCallback(() => {
        dispatch({ type: "CLOSE_BLOCK_MENU" });
    }, []);
    const toggleEditorState = useCallback(() => {
        dispatch({ type: "TOGGLE_EDITOR_STATE" });
    }, []);

    return {
        editorState: uiState,
        title,
        copied: uiState.copied,
        activeFormats,
        stats,
        showFolderMenu: uiState.showFolderMenu,
        showColorMenu: uiState.showColorMenu,
        showBlockMenu: uiState.showBlockMenu,
        showEditorState: uiState.showEditorState,
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
    };
};
