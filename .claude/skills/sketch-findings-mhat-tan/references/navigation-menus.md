# Navigation & Menus

## Design Decisions

**Winner: Simple Two-Option (Sketch 011-A)**

- **iOS-style bottom sheet** — Handle bar at top, title, two option rows. Familiar mobile pattern.
- **Icon + text + chevron** — Each option has a colored icon circle, title, description, and right chevron arrow. Clear visual hierarchy.
- **Backdrop overlay** — Semi-transparent overlay behind the sheet. Tap to dismiss.
- **Two options only** — Record Voice and New Note. Not overwhelming, focused on the two core creation flows.
- **Primary action first** — Record Voice is listed first since it's the app's primary interaction (voice-first for Burmese speakers).

## CSS Patterns

```css
/* Bottom sheet */
.a-sheet {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
  background: var(--color-surface); border-radius: 20px 20px 0 0;
  padding: 12px 0 40px;
}
.a-handle {
  width: 36px; height: 4px; border-radius: 2px; background: var(--color-border);
  margin: 0 auto 16px;
}

/* Option rows */
.a-option {
  display: flex; align-items: center; gap: 14px; padding: 14px 20px;
  cursor: pointer; transition: background 0.15s ease; border: none;
  background: transparent; width: 100%; text-align: left;
}
.a-option:hover { background: var(--color-surface-alt); }
.a-option-icon {
  width: 48px; height: 48px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
}
.a-option-icon.mic { background: var(--color-primary-light); }
.a-option-icon.note { background: var(--color-success-light); }
.a-option-text { flex: 1; }
.a-option-title { font-size: 16px; font-weight: 600; color: var(--color-text); }
.a-option-desc { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.a-option-arrow { color: var(--color-text-muted); font-size: 18px; }

/* Overlay */
.overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 10;
}
```

## HTML Structures

```html
<!-- Bottom sheet menu -->
<div class="overlay"></div>
<div class="a-sheet">
  <div class="a-handle"></div>
  <div class="a-title">Create New</div>
  <button class="a-option">
    <div class="a-option-icon mic">🎤</div>
    <div class="a-option-text">
      <div class="a-option-title">Record Voice</div>
      <div class="a-option-desc">Speak to create a new entry</div>
    </div>
    <div class="a-option-arrow">›</div>
  </button>
  <button class="a-option">
    <div class="a-option-icon note">📝</div>
    <div class="a-option-text">
      <div class="a-option-title">New Note</div>
      <div class="a-option-desc">Write a note manually</div>
    </div>
    <div class="a-option-arrow">›</div>
  </button>
</div>
```

## What to Avoid

- **Rich Cards (011-B):** Grid layout feels app-launcher-like, not creation-menu-like. Too much visual weight for a quick action menu.
- **Action List (011-C):** Extra options (Photo, File) add complexity before they're needed. Keyboard shortcut badges are irrelevant on mobile.

## Origin
Synthesized from sketch: 011-bottom-sheet-menu
Source files available in: sources/011-bottom-sheet-menu/
