import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, Heading2, Heading3, List, ListOrdered, 
  Eraser, Undo, Redo 
} from 'lucide-react';
import { markdownToHtml, htmlToMarkdown } from '../utils/markdownHelper';
import '../styles/RichTextEditor.css';

/**
 * Premium Rich Text Editor using Tiptap.
 * Automatically accepts Markdown input, renders HTML for rich-text editing,
 * and outputs clean Markdown for database storage and Zustand store synchronization.
 */
const RichTextEditor = React.forwardRef(({ 
  defaultValue = '', 
  onChange, 
  disabled = false, 
  placeholder = 'Write your answer...' 
}, ref) => {
  
  // Initialize the Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Standard StarterKit configurations
        heading: {
          levels: [2, 3]
        }
      })
    ],
    content: markdownToHtml(defaultValue),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        onChange(markdown);
      }
    }
  });

  // Keep editable state synced with parent props
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Expose the current markdown value on the ref so parent handleSave reads it seamlessly
  React.useImperativeHandle(ref, () => ({
    get value() {
      if (!editor) return '';
      const html = editor.getHTML();
      return htmlToMarkdown(html);
    },
    focus() {
      if (editor) {
        editor.commands.focus();
      }
    }
  }));

  if (!editor) {
    return (
      <div className="rich-text-editor-container loading-editor">
        <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor-container">
      {/* Sleek inline toolbar */}
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('bold') ? 'active' : ''}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('italic') ? 'active' : ''}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            title="Heading 3"
          >
            <Heading3 size={14} />
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            title="Bullet List"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={`rte-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            disabled={disabled}
            className="rte-btn"
            title="Clear Formatting"
          >
            <Eraser size={14} />
          </button>
        </div>

        <div className="rte-toolbar-divider" style={{ marginLeft: 'auto' }} />

        <div className="rte-toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            className="rte-btn"
            title="Undo"
          >
            <Undo size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            className="rte-btn"
            title="Redo"
          >
            <Redo size={14} />
          </button>
        </div>
      </div>

      {/* Editor Content editable area */}
      <div className="rte-content-area">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
});

export default RichTextEditor;
