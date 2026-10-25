import React from 'react'

interface EditorZoneProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  title: string
  handleTitleChange: React.ChangeEventHandler<HTMLInputElement>
  handleContentInput: () => void
  updateActiveFormats: () => void
}

const EditorZone = ({
  editorRef,
  title,
  handleTitleChange,
  handleContentInput,
  updateActiveFormats,
}: EditorZoneProps) => {
    const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
        handleContentInput();
    }
  return (
    <div>
             <div 
        className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto cursor-text"
        onClick={() => {
          if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.focus();
          }
        }}
        onTouchEnd={(e) => {
          if (e.target === e.currentTarget && editorRef.current) {
            editorRef.current.focus();
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

        {/* WYSIWYG ContentEditable Area */}
        <div
          ref={editorRef}
          contentEditable
          tabIndex={0}
          suppressContentEditableWarning
          onInput={handleContentInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder="Escribe tu nota aquí... Puedes aplicar negrita, cursiva, subrayado, listas con viñetas o numeradas y ajustar la alineación del texto."
          className="flex-1 min-h-[400px] pb-36 outline-hidden text-slate-800 dark:text-slate-200 text-base leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none
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
  )
}

export default EditorZone