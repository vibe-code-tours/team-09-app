---
sketch: 001
name: record-button
question: "How should the primary record button look and feel?"
winner: "C"
tags: [record-button, primary-action, fab, interaction]
---

# Sketch 001: Record Button Design

## Design Question
How should the primary record voice entry button look and where should it be placed on the home screen?

## How to View
Open `.planning/sketches/001-record-button/index.html` in a browser.

## Variants

- **A: Floating Action Button (FAB)** — Large circular button floating at bottom center with pulse animation. Separates recording from navigation. Familiar from Android apps.

- **B: Inline Card Button** — Prominent gradient card in the main content area. Explains what the action does ("Speak your day"). Most structured, Notion/Todoist-like.

- **C: Center Tab Button** — Elevated center button in the tab bar, like Instagram's Reels button. Integrates recording into navigation flow.

## What to Look For

1. **Visual weight** — Which variant makes recording feel most inviting?
2. **Discoverability** — How quickly can a new user find the record action?
3. **Content flow** — Does the button compete with or complement the entry feed?
4. **Mobile ergonomics** — Can you reach it comfortably with one hand?
5. **Recording state** — How does each variant handle the "recording" overlay?

## States to Test
Use the bottom-left states bar to switch between:
- **Populated** — Multiple entries visible
- **Empty** — No entries yet
- **Recording** — Active recording state (click the record button)
