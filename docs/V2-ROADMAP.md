# Resolution Cleaner V2 — The Split-Pane Workspace

**Vision:** Move from a "blind" list of replacements to a fully contextual, bi-directional workspace that mirrors the confidence of the Bond Generator.
**Target:** Desktop-first enhancement (while maintaining the existing V1 mobile layout).

---

## 1. The Core UX Shift: Split-Pane Architecture

Instead of scrolling a long list of snippets, V2 introduces a split-pane layout for tablet (`lg`) and desktop (`xl`) screens, mapping to the `LAYOUT-SPACE-STANDARDS.md`.

```
┌─────────────────────────────────┬────────────────────────────────────────────┐
│ LEFT PANE (The Hub)             │ RIGHT PANE (The Document Preview)          │
│ max-w-md, fixed width, scroll   │ flex-1, full height iframe/viewer          │
│                                 │                                            │
│ ── DATES (3) ───────────────    │ RESOLUTION NO. 1234                        │
│                                 │                                            │
│ [ September 1, 2024      11× ]  │ ...pursuant to the Bond Purchase           │
│                                 │ Agreement dated [September 1, 2024],       │
│ ── AMOUNTS (2) ─────────────    │ between the [City of San Francisco] and... │
│                                 │                                            │
│ [ $84,116,000             5× ]  │                                            │
└─────────────────────────────────┴────────────────────────────────────────────┘
```

### Mobile Fallback (`< lg`)
On mobile, the layout remains exactly as it is in V1: a stacked list, where "Preview" opens a full-screen overlay containing the HTML/PDF preview instead of just the 60-character text snippet.

---

## 2. The Interaction Loop (Bi-Directional Sync)

V2 is defined by the connection between the Left and Right panes:

1. **Global Highlighting:** Upon parsing, the Right Pane renders the document with *all* detected variables highlighted.
    - Pending: `bg-yellow-900/60 text-yellow-200`
    - Confirmed: `bg-green-900/60 text-green-200`
    - Locked (Issuer): `bg-amber-900/40 text-amber-200`

2. **Left-to-Right Sync:** 
    - Clicking "Preview" on a group in the Left Pane automatically scrolls the Right Pane to the first occurrence of that variable.
    - The active highlight pulses to draw the user's eye.

3. **Right-to-Left Sync:**
    - Clicking any highlighted text directly inside the Right Pane document automatically opens the "Replace" form for that specific variable group in the Left Pane.

4. **Live Visual Swapping:**
    - When the user confirms a replacement (e.g., "$84,116,000" → "$90,000,000"), the highlight in the Right Pane instantly updates to show the new text and turns green.
    - An "Undo" button appears in the Left Pane to instantly revert the visual change.

---

## 3. Technical Implementation Strategy

Rendering `.docx` faithfully in a browser is the primary technical hurdle. To achieve the Bond Generator-style preview without breaking formatting trust, we use the **HTML Approximation + Disclaimer** strategy.

### The Backend Pipeline
1. Upload `.docx`.
2. Extract flat text and run regex (V1 engine — remains unchanged).
3. **NEW:** Pass the `.docx` buffer to an HTML converter (e.g., `mammoth.js` or a dedicated microservice).
4. Inject `<mark>` tags into the generated HTML at the exact character offsets found by the V1 engine.
5. Return both `variableGroups` and `previewHtml` to the frontend.

### The Frontend Architecture (`ELITE-STANDARDS.md` compliant)
To prevent the page component from bloating past the 150-line limit, logic will be heavily abstracted into specialized hooks:

- **`useDocumentPreview.ts`:** Manages the HTML string, active highlight state, and scroll-to-element logic via `postMessage` (if using an iframe) or React refs.
- **`useBiDirectionalSync.ts`:** Orchestrates the state between `useVariableGroups` and `useDocumentPreview`.

**Safety Disclaimer:**
Because HTML conversion is never 100% pixel-perfect for complex Word docs, the preview pane must contain a persistent, standard-compliant badge:
> *"Preview formatting is approximate. Your downloaded .docx will retain 100% of its original layout and styling."*

---

## 4. Required Component Updates

1. **`DocumentWorkspace.tsx` (New Organism)**
   - The primary wrapper for the split-pane layout. Uses `grid-cols-[minmax(0,400px)_1fr]` on `lg:` breakpoints.
2. **`DocumentPreviewIframe.tsx` (New Atom)**
   - Sandbox iframe that safely renders the HTML.
   - Listens for postMessage events to scroll to specific `<mark id="occurrence-5">` elements.
   - Emits postMessage events when a user clicks a `<mark>` inside the iframe.
3. **`VariableGroupRow.tsx` (Update)**
   - Refined to be slightly more compact to fit the 400px left pane width.

---

## 5. Definition of Done for V2

- [ ] Desktop users see the document preview immediately after parsing.
- [ ] Every detected variable is highlighted in the preview.
- [ ] Clicking a group in the list scrolls the preview to that occurrence.
- [ ] Clicking a highlight in the preview opens the edit form in the list.
- [ ] Applying a replacement updates the text in the preview live.
- [ ] Original V1 deterministic `.docx` replacement engine remains untouched and 100% safe.