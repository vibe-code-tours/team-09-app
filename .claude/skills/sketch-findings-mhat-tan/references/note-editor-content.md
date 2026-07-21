# Note Editor & Content

## Design Decisions

**Winner: Notion-like (Sketch 010-B)**

- **Toolbar with View/Edit toggle** — Clear mode switch at the top, not buried in headers. Users explicitly choose when to see rendered markdown vs raw text.
- **Metadata chips below title** — Category (😊 Feelings), Pin (📌 Pinned), Time (🕐 2h ago), Audio duration (🔊 0:45) displayed as inline chips. Scannable at a glance.
- **Contenteditable title** — Large, bold title field that feels like a document, not a form input.
- **Rendered markdown in view mode** — Full markdown rendering with styled headings, bold, italic, lists, code blocks, blockquotes, and links.
- **Raw text in edit mode** — Plain textarea with placeholder hint "(supports **markdown**)". No formatting toolbar in edit mode — keeps it simple.

## CSS Patterns

```css
/* Toolbar */
.b-toolbar {
  display: flex; gap: 2px; padding: 8px 20px;
  border-bottom: 1px solid var(--color-border); overflow-x: auto;
}
.b-tool {
  padding: 6px 10px; border-radius: var(--radius-sm); font-size: 13px;
  cursor: pointer; border: none; background: transparent; white-space: nowrap;
  transition: all 0.15s ease; color: var(--color-text-muted);
}
.b-tool:hover { background: var(--color-surface-alt); color: var(--color-text); }
.b-tool.active { background: var(--color-primary-light); color: var(--color-primary); }

/* Metadata chips */
.b-meta { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.b-meta-item {
  display: flex; align-items: center; gap: 6px; font-size: 13px;
  color: var(--color-text-muted); padding: 4px 8px; border-radius: var(--radius-sm);
  cursor: pointer; transition: all 0.15s ease;
}
.b-meta-item:hover { background: var(--color-surface-alt); }

/* Title */
.b-title {
  font-size: 32px; font-weight: 700; border: none; outline: none; width: 100%;
  background: transparent; color: var(--color-text); margin-bottom: 8px;
}
```

## HTML Structures

```html
<!-- Notion-like note editor -->
<div class="b-header">
  <div class="b-back">←</div>
  <div class="b-header-center">
    <div class="b-save-status"><div class="b-save-dot"></div> Saved</div>
  </div>
  <div class="b-header-actions">
    <button class="b-icon-btn">📌</button>
    <button class="b-icon-btn">⋯</button>
  </div>
</div>
<div class="b-toolbar">
  <button class="b-tool active">View</button>
  <button class="b-tool">Edit</button>
  <button class="b-tool">😊 Feelings</button>
  <button class="b-tool">🎤 Audio</button>
</div>
<div class="b-body">
  <div class="b-title" contenteditable="false">Note Title</div>
  <div class="b-meta">
    <div class="b-meta-item">😊 Feelings</div>
    <div class="b-meta-item">📌 Pinned</div>
    <div class="b-meta-item">🕐 2h ago</div>
  </div>
  <!-- Rendered markdown or raw textarea -->
</div>
```

## What to Avoid

- **Clean Minimal (010-A):** Header-only actions (Edit/Save buttons) feel disconnected from the content. No metadata visibility.
- **Writing-focused (010-C):** Auto-hiding UI is disorienting on mobile. Users shouldn't need to hover to find controls. Footer pills are too hidden.

## Origin
Synthesized from sketch: 010-note-editor
Source files available in: sources/010-note-editor/
