---
sketch: 005
name: expense-list
question: "How should individual expense items be displayed?"
winner: "A"
tags: [money, expense, list, cards, voice]
---

# Sketch 005: Expense List

## Design Question
How should individual money entries be displayed in the full expense list? What information should each item show and how should it be structured?

## How to View
Open `.planning/sketches/005-expense-list/index.html` in a browser.

## Variants

- **A: Expense Cards** — Detailed cards with left category border, voice transcript quote, category badge, date, and amount. Each card is a distinct block. Familiar card pattern matching the HomeScreen.

- **B: Receipt Style** — Single receipt-like container with dotted separators, subtotals per day, and clean typography. Items are compact line entries. Feels like a real receipt/spending record.

- **C: Voice-First** — Each expense shows the full voice transcript prominently with a waveform decoration. Category badges below. Emphasizes that spending was captured by voice, not typed. Most unique, most "Mhat Tan."

## What to Look For

1. **Voice emphasis** — Which variant best communicates that these entries came from voice recording?
2. **Scannability** — How quickly can you find a specific expense?
3. **Amount visibility** — Is the spending amount easy to spot?
4. **Category clarity** — How obvious is each entry's spending category?
5. **Detail level** — Too much or too little information per entry?

## States to Test
Use the bottom-left states bar to switch between:
- **Populated** — Multiple expense entries visible
- **Empty** — No money entries yet
