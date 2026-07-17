# Onboarding & Empty States

## Design Decisions

**Winner: Illustration + CTA (Sketch 012-A)**

- **Animated microphone illustration** — Large circular icon with pulse animation. Draws attention and communicates "voice-first" immediately.
- **Friendly, action-oriented copy** — "No entries yet" + "Start recording your daily thoughts, expenses, and ideas." Clear and encouraging.
- **Two clear CTAs** — "Record Your First Entry" (primary, pink) and "Write a Note" (secondary, outlined). Gives users a choice without overwhelming.
- **Illustration in a circle** — The mic icon sits inside a primary-colored circle with a dashed border animation. Feels alive and inviting.
- **Greeting header preserved** — The "Good Morning" greeting and user name stay visible even when empty. Personalizes the experience.

## CSS Patterns

```css
/* Empty state container */
.a-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 32px; text-align: center;
}

/* Animated illustration */
.a-illustration {
  width: 120px; height: 120px; border-radius: 50%; background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center; font-size: 56px;
  margin-bottom: 24px; position: relative;
}
.a-illustration::after {
  content: ''; position: absolute; width: 140px; height: 140px;
  border-radius: 50%; border: 2px dashed var(--color-primary); opacity: 0.2;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.05); opacity: 0.3; }
}

/* CTA buttons */
.a-cta { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 260px; }
.a-cta-btn {
  padding: 14px 24px; border-radius: var(--radius-lg); font-size: 15px;
  font-weight: 600; cursor: pointer; border: none; transition: all 0.2s ease;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.a-cta-primary { background: var(--color-primary); color: white; box-shadow: var(--shadow-primary); }
.a-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(233,30,99,0.3); }
.a-cta-secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
.a-cta-secondary:hover { background: var(--color-surface-alt); }
```

## HTML Structures

```html
<!-- Empty state -->
<div class="a-header">
  <div class="a-greeting">🌅 Good Morning</div>
  <div class="a-title">Hello, User</div>
</div>
<div class="a-empty">
  <div class="a-illustration">🎙️</div>
  <div class="a-empty-title">No entries yet</div>
  <div class="a-empty-desc">Start recording your daily thoughts, expenses, and ideas. Your first entry is just a tap away.</div>
  <div class="a-cta">
    <button class="a-cta-btn a-cta-primary">🎤 Record Your First Entry</button>
    <button class="a-cta-btn a-cta-secondary">📝 Write a Note</button>
  </div>
</div>
```

## What to Avoid

- **Minimal Text (012-B):** Too sparse — a single icon and "Get Started" button feels generic and uninviting. No personality.
- **Onboarding Steps (012-C):** Numbered steps feel like a tutorial, not an empty state. Too much text for users who may not read English fluently. Overwhelming for first launch.

## Origin
Synthesized from sketch: 012-empty-states
Source files available in: sources/012-empty-states/
