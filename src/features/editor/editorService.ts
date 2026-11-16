import type { Editor } from "@tiptap/core";
import type { ActiveFormats, EditorStats } from "./editorTypes";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export const EDITOR_EXTENSIONS = [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({
        placeholder: "Escribe tu nota aquí... Puedes aplicar negrita, cursiva, subrayado, listas con viñetas o numeradas y ajustar la alineación del texto.",
    }),
];

export function extractText(editor: Editor): string {
    return editor.state.doc.textBetween(0, editor.state.doc.content.size, " ");
}

export function calculateEditorStats(editor: Editor): EditorStats {
    const text = extractText(editor).trim();
    const words = text ? text.split(/\s+/).length : 0;
    return {
        words,
        chars: text.length,
        readTime: Math.max(1, Math.ceil(words / 200)),
    };
}

export function readActiveFormats(editor: Editor): ActiveFormats {
    const alignCenter = editor.isActive({ textAlign: "center" });
    const alignRight = editor.isActive({ textAlign: "right" });
    const alignJustify = editor.isActive({ textAlign: "justify" });

    let currentBlock = "p";
    if (editor.isActive("heading", { level: 1 })) currentBlock = "h1";
    else if (editor.isActive("heading", { level: 2 })) currentBlock = "h2";
    else if (editor.isActive("heading", { level: 3 })) currentBlock = "h3";
    else if (editor.isActive("blockquote")) currentBlock = "blockquote";

    return {
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" })
            || (!alignCenter && !alignRight && !alignJustify),
        alignCenter,
        alignRight,
        alignJustify,
        currentBlock,
    };
}

export function executeEditorCommand(
    editor: Editor,
    command: string,
    value?: string | number,
): void {
    const chain = editor.chain().focus();

    switch (command) {
        case "bold":
            chain.toggleBold().run();
            break;
        case "italic":
            chain.toggleItalic().run();
            break;
        case "underline":
            chain.toggleUnderline().run();
            break;
        case "strikeThrough":
        case "strike":
            chain.toggleStrike().run();
            break;
        case "insertUnorderedList":
            chain.toggleBulletList().run();
            break;
        case "insertOrderedList":
            chain.toggleOrderedList().run();
            break;
        case "justifyCenter":
            chain.setTextAlign("center").run();
            break;
        case "justifyRight":
            chain.setTextAlign("right").run();
            break;
        case "justifyFull":
            chain.setTextAlign("justify").run();
            break;
        case "justifyLeft":
            chain.setTextAlign("left").run();
            break;
        case "formatBlock": {
            const block = typeof value === "string"
                ? value.toLowerCase().replace(/[<>/]/g, "").trim()
                : "";
            if (block === "h1") chain.toggleHeading({ level: 1 }).run();
            else if (block === "h2") chain.toggleHeading({ level: 2 }).run();
            else if (block === "h3") chain.toggleHeading({ level: 3 }).run();
            else if (block === "blockquote") chain.toggleBlockquote().run();
            else if (block === "p") chain.setParagraph().run();
            else console.warn(`Comando no soportado: ${command}`, value);
            break;
        }
        case "h1":
            chain.toggleHeading({ level: 1 }).run();
            break;
        case "h2":
            chain.toggleHeading({ level: 2 }).run();
            break;
        case "h3":
            chain.toggleHeading({ level: 3 }).run();
            break;
        case "blockquote":
            chain.toggleBlockquote().run();
            break;
        case "p":
            chain.setParagraph().run();
            break;
        case "insertHorizontalRule":
            chain.setHorizontalRule().run();
            break;
        case "removeFormat":
            chain.unsetAllMarks().clearNodes().run();
            break;
        default:
            console.warn(`Comando no soportado: ${command}`);
    }
}

export function copyNote(title: string, editor: Editor): Promise<void> {
    return navigator.clipboard.writeText(`${title}\n\n${extractText(editor)}`);
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    })[character] ?? character);
}

export function exportNote(title: string, editor: Editor, type: "html" | "txt"): void {
    let blob: Blob;
    let extension: string;

    if (type === "html") {
        const safeTitle = escapeHtml(title || "Nota");
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    blockquote { border-left: 4px solid #3b82f6; margin: 16px 0; padding-left: 16px; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title || "Sin título")}</h1>
  ${editor.getHTML()}
</body>
</html>`;
        blob = new Blob([fullHtml], { type: "text/html" });
        extension = "html";
    } else {
        const text = `${title}\n\n${extractText(editor)}`;
        blob = new Blob([text], { type: "text/plain" });
        extension = "txt";
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(title || "nota").replace(/[/\\?%*:|"<>]/g, "-")}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
}
