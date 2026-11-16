import type { ReactNode } from "react";
import type { ActiveFormats } from "../features/editor/editorTypes";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  RemoveFormatting,
  RotateCcw,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react";

interface EditorToolbarProps {
  activeFormats: ActiveFormats;
  canUndo: boolean;
  executeFormat: (command: string, value?: string | number) => void;
  onUndo: () => void;
  showBlockMenu: boolean;
  toggleBlockMenu: () => void;
  closeBlockMenu: () => void;
}

const blockLabels: Record<string, string> = {
  p: "Párrafo",
  h1: "Título grande (H1)",
  h2: "Título mediano (H2)",
  h3: "Subtítulo (H3)",
  blockquote: "Cita en bloque",
};

const activeButtonClass =
  "bg-blue-600 text-white shadow-xs";
const inactiveButtonClass =
  "hover:bg-slate-200 dark:hover:bg-slate-800";

export const EditorToolbar = ({
  activeFormats,
  canUndo,
  executeFormat,
  onUndo,
  showBlockMenu,
  toggleBlockMenu,
  closeBlockMenu,
}: EditorToolbarProps) => (
  <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 px-4 py-2 text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300 sm:px-6">
    <div
      className={`flex items-center gap-1 select-none scrollbar-none ${
        showBlockMenu ? "overflow-visible" : "overflow-x-auto"
      }`}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).tagName !== "BUTTON") {
          event.preventDefault();
        }
      }}
    >
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-lg p-1.5 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
        title="Deshacer (Ctrl+Z)"
        aria-label="Deshacer"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px shrink-0 bg-slate-300 dark:bg-slate-700" />

      <div className="relative shrink-0">
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlockMenu();
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          title="Estilo de párrafo o encabezado"
          aria-expanded={showBlockMenu}
        >
          <span>{blockLabels[activeFormats.currentBlock] || "Párrafo"}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>

        {showBlockMenu && (
          <div
            className="absolute left-0 top-9 z-40 w-48 rounded-xl border border-slate-200 bg-white py-1 text-xs shadow-xl animate-in fade-in dark:border-slate-700 dark:bg-slate-800"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <BlockOption
              active={activeFormats.currentBlock === "p"}
              onSelect={() => executeFormat("formatBlock", "<p>")}
              onClose={closeBlockMenu}
              icon={<Type className="h-3.5 w-3.5" />}
              label="Párrafo normal"
            />
            <BlockOption
              active={activeFormats.currentBlock === "h1"}
              onSelect={() => executeFormat("formatBlock", "<h1>")}
              onClose={closeBlockMenu}
              icon={<Heading1 className="h-3.5 w-3.5" />}
              label="Título grande (H1)"
              labelClassName="text-sm font-bold"
            />
            <BlockOption
              active={activeFormats.currentBlock === "h2"}
              onSelect={() => executeFormat("formatBlock", "<h2>")}
              onClose={closeBlockMenu}
              icon={<Heading2 className="h-3.5 w-3.5" />}
              label="Título mediano (H2)"
              labelClassName="text-xs font-semibold"
            />
            <BlockOption
              active={activeFormats.currentBlock === "h3"}
              onSelect={() => executeFormat("formatBlock", "<h3>")}
              onClose={closeBlockMenu}
              icon={<Heading3 className="h-3.5 w-3.5" />}
              label="Subtítulo (H3)"
            />
            <BlockOption
              active={activeFormats.currentBlock === "blockquote"}
              onSelect={() => executeFormat("formatBlock", "<blockquote>")}
              onClose={closeBlockMenu}
              icon={<Quote className="h-3.5 w-3.5" />}
              label="Cita en bloque"
              labelClassName="italic"
            />
          </div>
        )}
      </div>

      <Divider />
      <div className="flex shrink-0 items-center gap-0.5">
        <FormatButton
          active={activeFormats.bold}
          onClick={() => executeFormat("bold")}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-4 w-4 stroke-[2.5]" />
        </FormatButton>
        <FormatButton
          active={activeFormats.italic}
          onClick={() => executeFormat("italic")}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </FormatButton>
        <FormatButton
          active={activeFormats.underline}
          onClick={() => executeFormat("underline")}
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </FormatButton>
        <FormatButton
          active={activeFormats.strike}
          onClick={() => executeFormat("strikeThrough")}
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </FormatButton>
      </div>

      <Divider />
      <div className="flex shrink-0 items-center gap-0.5">
        <FormatButton active={activeFormats.alignLeft} onClick={() => executeFormat("justifyLeft")} title="Alinear a la izquierda">
          <AlignLeft className="h-4 w-4" />
        </FormatButton>
        <FormatButton active={activeFormats.alignCenter} onClick={() => executeFormat("justifyCenter")} title="Centrar">
          <AlignCenter className="h-4 w-4" />
        </FormatButton>
        <FormatButton active={activeFormats.alignRight} onClick={() => executeFormat("justifyRight")} title="Alinear a la derecha">
          <AlignRight className="h-4 w-4" />
        </FormatButton>
        <FormatButton active={activeFormats.alignJustify} onClick={() => executeFormat("justifyFull")} title="Justificar texto">
          <AlignJustify className="h-4 w-4" />
        </FormatButton>
      </div>

      <Divider />
      <div className="flex shrink-0 items-center gap-0.5">
        <FormatButton active={activeFormats.bulletList} onClick={() => executeFormat("insertUnorderedList")} title="Lista con viñetas">
          <List className="h-4 w-4" />
        </FormatButton>
        <FormatButton active={activeFormats.orderedList} onClick={() => executeFormat("insertOrderedList")} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </FormatButton>
      </div>

      <Divider />
      <div className="flex shrink-0 items-center gap-0.5">
        <ToolbarButton onClick={() => executeFormat("formatBlock", "<blockquote>")} title="Cita en bloque">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => executeFormat("insertHorizontalRule")} title="Insertar línea divisoria">
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => executeFormat("removeFormat")}
          title="Eliminar formato"
          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  </div>
);

interface BlockOptionProps {
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
  icon: ReactNode;
  label: string;
  labelClassName?: string;
}

const BlockOption = ({
  active,
  onSelect,
  onClose,
  icon,
  label,
  labelClassName = "",
}: BlockOptionProps) => (
  <button
    type="button"
    onMouseDown={(event) => {
      event.preventDefault();
      onSelect();
      onClose();
    }}
    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
      active ? "font-semibold text-blue-600" : ""
    }`}
  >
    {icon}
    <span className={labelClassName}>{label}</span>
  </button>
);

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

const ToolbarButton = ({
  onClick,
  title,
  children,
  className = "",
}: ToolbarButtonProps) => (
  <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`rounded-lg p-1.5 transition hover:bg-slate-200 dark:hover:bg-slate-800 ${className}`}
    title={title}
  >
    {children}
  </button>
);

interface FormatButtonProps extends ToolbarButtonProps {
  active: boolean;
}

const FormatButton = ({ active, className = "", ...props }: FormatButtonProps) => (
  <ToolbarButton
    {...props}
    className={`${active ? activeButtonClass : inactiveButtonClass} ${className}`}
  />
);

const Divider = () => (
  <div className="mx-1 h-4 w-px shrink-0 bg-slate-300 dark:bg-slate-700" />
);
