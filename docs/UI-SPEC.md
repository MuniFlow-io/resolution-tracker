# Resolution Cleaner v1 — Mobile-First UI Specification

**Standards Applied:** All standards in `Resolution-Tracker/standards/`  
**Approach:** Mobile-first, then desktop enhancement. Built as a surgical instrument, not a product showcase.  
**Last Updated:** February 2026

---

## Design Philosophy for This Tool

This is not a marketing page. This is not a dashboard. This is a surgical instrument used by attorneys and bond professionals handling live deals.

The correct emotional register is: **calm, deterministic, clinical.**

```
✅ Clean typography
✅ Clear grouping
✅ Obvious occurrence counts
✅ One clear action per step
✅ Nothing changes without the user clicking Confirm

❌ Gradient backgrounds everywhere
❌ Icons on every element
❌ Animated transitions between steps
❌ Sidebar navigation
❌ Feature teasers or roadmap tooltips
```

The entire color budget for this tool: near zero brand color. Status colors only. White text on near-black. This is not a place for visual drama.

---

## Applying the Standards to This Tool

### From `COLOR-AND-VISUAL-RESTRAINT-STANDARDS.md`

- **Gradient budget:** One gradient CTA — the primary Download button. Nowhere else.
- **Accent color (mint/purple):** Reserved for the hub landing page card only. Not inside the tool.
- **Status colors** used throughout the tool:
  - Pending group → neutral (gray-700 border, white text)
  - Confirmed for replacement → `green-950/20` bg, `green-400` text/border
  - Ignored → `gray-800` bg, `gray-500` text, strikethrough
  - Locked (issuer) → `amber-950/20` bg, `amber-400` text/border
  - Error state → `red-950/20` bg, `red-400` text/border

### From `LAYOUT-SPACE-STANDARDS.md`

- **Container:** `max-w-3xl mx-auto px-4 sm:px-6` — focused single-column flow
- **Density level:** Standard — `gap-4` to `gap-6`, `p-4` to `p-6`
- **Section spacing:** `py-8 sm:py-12` — functional app, not marketing

### From `RESPONSIVE-DESIGN-STANDARDS.md`

- **Breakpoints used:** Mobile (default), `sm` (640px), `lg` (1024px)
- **Preview panel:** Full-screen overlay on mobile, inline side panel on `lg`+
- **Touch targets:** All interactive controls minimum 44×44px

### From `LOADING-STRATEGY-STANDARDS.md`

- **After upload:** Skeleton of the variable group sections while server parses
- **No lazy loading needed:** This is a focused single-page tool
- **Download:** Synchronous client-side blob creation after API returns base64

### From `ERROR-UX-STANDARDS.md`

- **Upload errors:** Inline below upload zone (wrong type, too large)
- **Parse failure:** Inline section banner with retry button
- **Replacement mismatch:** Blocking error with clear explanation + "Start Over" option
- **Network errors:** Toast with retry

### From `VALIDATION-STANDARDS.md`

- **"Replace with" input:** Validate on blur (required, min 1 char), then live after first submit attempt
- **File upload:** Validate extension + MIME type on selection (before upload)

---

## App Step Flow

```
[Hub Landing]
     ↓ click "Resolution Cleaner"
[Upload Screen]
     ↓ file selected + upload
[Parsing → Skeleton]
     ↓ parse complete
[Review Screen — Variable Groups]
     ↓ click "Preview" on a group
[Preview Panel opens]
     ↓ click "Replace"
[Replace Form opens]
     ↓ enter value + confirm
     ↓ (back to Review Screen for next group)
     ↓ all groups resolved, click "Apply All Confirmed"
[Replacing → Skeleton]
     ↓ replace complete
[Complete Screen — Change Log + Download]
```

---

## Screen 1: Hub Landing Page (`app/page.tsx`)

**Container:** `max-w-3xl mx-auto px-4 sm:px-6 py-16`

```
┌─────────────────────────────────────────┐
│                                         │
│  Document Hub                           │  ← text-2xl sm:text-3xl font-bold text-white
│  Precision tools for deal documents.    │  ← text-sm text-gray-400 mt-2
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Resolution Cleaner                  ││  ← Active tool card
│  │ Update a resolution for a new deal  ││
│  │ without rewriting any language.     ││
│  │                                     ││
│  │              [Open Tool →]          ││  ← Button variant="primary"
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Bond Generator        [External ↗]  ││  ← Grayed out secondary card
│  │ Certificate generation              ││    opacity-50, pointer-events still work
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

**Component: `ToolCard.tsx`**

```typescript
interface ToolCardProps {
  title: string;
  description: string;
  status: 'active' | 'external' | 'coming_soon';
  href: string;
}
```

**Color decisions:**
- Active card: `border border-gray-700 hover:border-gray-500 bg-gray-900`
- External card: `border border-gray-800 bg-gray-900/50 opacity-60`
- NO gradient on cards. This is an app, not a marketing page.

---

## Screen 2: Upload Screen (`app/resolution-cleaner/page.tsx`, step = 'upload')

**Container:** `max-w-3xl mx-auto px-4 sm:px-6 py-10`

```
┌─────────────────────────────────────────────┐
│                                             │
│  ← Back to Hub                             │  ← text-sm text-gray-400, ghost button
│                                             │
│  Resolution Cleaner                         │  ← text-2xl font-bold text-white
│  Upload a resolution to detect and replace  │  ← text-sm text-gray-400 mt-1
│  deal-specific variables.                   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │                                      │   │
│  │     [Upload icon — 40px]             │   │
│  │                                      │   │  ← Upload zone
│  │  Drop your resolution here           │   │     min-h-48, border-2 border-dashed
│  │  or click to browse                  │   │     border-gray-700, rounded-xl
│  │                                      │   │     hover:border-gray-500
│  │  .docx files only — max 10MB        │   │     bg-gray-900/50
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [error message here if wrong type]         │  ← text-xs text-red-400 with AlertCircle icon
│                                             │
└─────────────────────────────────────────────┘
```

**Responsive behavior:**
- Mobile: full-width upload zone, stacked layout
- Desktop: same — there is no side-by-side here, the upload is centered

**Upload zone states:**
- Idle: `border-dashed border-gray-700`
- Drag-over: `border-gray-400 bg-gray-800/50`
- File selected: `border-green-700 bg-green-950/20` with filename shown
- Error: `border-red-700 bg-red-950/20`

---

## Screen 3: Parsing (step = 'parsing')

Show immediately after file upload begins. The user sees the structure of what is coming, not a blank screen.

```
┌─────────────────────────────────────────────┐
│                                             │
│  Parsing Balboa_Resolution_2024.docx...     │  ← text-sm text-gray-400
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Dates                               │   │  ← Skeleton section
│  │  ████████████████  ████████          │   │
│  │  ████████████████████                │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Dollar Amounts                      │   │  ← Skeleton section
│  │  ████████████████  ████████          │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Parties                             │   │
│  │  ████████████████  ████████          │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Standard applied:** `LOADING-STRATEGY-STANDARDS.md` — skeleton, never spinner for content areas.

---

## Screen 4: Review Screen (step = 'review')

This is the main working screen. The user spends most of their time here.

**Mobile layout (< lg):** Single column, full-width rows
**Desktop layout (lg+):** Optional — if preview is open, split into content + preview panel

```
┌─────────────────────────────────────────────┐
│  Balboa_Resolution_2024.docx                │  ← text-sm text-gray-400
│  12 variable groups detected                │
│                                             │
│  ── DATES (3) ──────────────────────────   │  ← Section header: text-xs uppercase tracking-wide text-gray-500
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ September 1, 2024          11 times    │ │  ← VariableGroupRow (status: pending)
│  │ [Preview] [Replace] [Ignore]           │ │     border border-gray-800 rounded-lg p-4
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ 09/01/2024                  3 times    │ │
│  │ [Preview] [Replace] [Ignore]           │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ── DOLLAR AMOUNTS (4) ─────────────────   │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ $84,116,000                 5 times    │ │
│  │ [Preview] [Replace] [Ignore]           │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ...                                        │
│                                             │
│  ── ANCHORS (LOCKED) ───────────────────   │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ 🔒 City of San Diego       [LOCKED]    │ │  ← amber badge, no action buttons
│  └────────────────────────────────────────┘ │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  [Apply All Confirmed (3)]                  │  ← Primary button — disabled until at least 1 confirmed
│  "We only replace the exact text you        │  ← text-xs text-gray-500 mt-2
│   confirm. We don't rewrite any language."  │
│                                             │
└─────────────────────────────────────────────┘
```

**VariableGroupRow states and styles:**

```typescript
// Status: pending (default)
"border border-gray-800 bg-gray-900 rounded-lg p-4"

// Status: confirmed (user has set a replacement value)
"border border-green-800/50 bg-green-950/20 rounded-lg p-4"

// Status: ignored
"border border-gray-800 bg-gray-900/50 rounded-lg p-4 opacity-50"
// Value text: line-through text-gray-500

// Status: locked (issuer)
"border border-amber-800/30 bg-amber-950/10 rounded-lg p-4"
```

**Mobile row layout:**
```
Row:
  [exact text]                    [N times badge]
  [Preview]  [Replace]  [Ignore]
```

**Desktop row layout (sm+):**
```
Row:
  [exact text]          [N times badge]    [Preview] [Replace] [Ignore]
  ─ single row ─────────────────────────────────────────────────────────
```

**Touch targets:** All three buttons must be minimum 44px tall on mobile. Use `min-h-[44px]` with appropriate padding.

---

## Screen 4b: Preview Panel

Opens when user clicks "Preview" on any variable group.

**Mobile (< lg):** Full-screen modal overlay — slides up from bottom
**Desktop (lg+):** Side panel anchored to the right, 40% width

```
┌──────────────────────────────────────────────┐
│  Preview: "September 1, 2024"                │  ← text-sm font-medium text-white
│  Occurrence 3 of 11       [✕ Close]          │  ← text-xs text-gray-400
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ ...pursuant to the Bond Purchase         ││
│  │ Agreement dated [September 1, 2024]      ││  ← highlighted span: bg-yellow-900/50 text-yellow-300
│  │ between the City and the Underwriter...  ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [← Prev]  3 / 11  [Next →]                 │  ← Navigation — large touch targets
│                                              │
│  [☐ Exclude this occurrence]                 │  ← Checkbox toggle
│                                              │
└──────────────────────────────────────────────┘
```

**Color note:** The highlight is `bg-yellow-900/50 text-yellow-300` — a functional highlight, not a brand color. This is the signal "here is what will be replaced."

**Excluded occurrence styling:**
```
│ ...pursuant to the Bond Purchase             │
│ ~~Agreement dated September 1, 2024~~       │  ← line-through, text-gray-500
│ between the City and the Underwriter...     │
└──────────────────────────────────────────────┘
  ✅ Excluded from replacement
```

---

## Screen 4c: Replace Form

Opens when user clicks "Replace" on a variable group. On mobile: replaces the bottom section of the screen. On desktop: appears within the row itself (inline expansion) or in the side panel.

```
┌─────────────────────────────────────────────┐
│ Replace: "September 1, 2024"                │
│ Will replace 11 occurrences                 │  ← count updates if user excluded any
│                                             │
│ Replace with:                               │
│ ┌───────────────────────────────────────┐   │
│ │ June 1, 2026                          │   │  ← text input, min-h-[44px]
│ └───────────────────────────────────────┘   │
│ [error message if empty — text-red-400]     │
│                                             │
│ [Confirm Replacement]      [Cancel]         │  ← Primary + ghost buttons
│                                             │
└─────────────────────────────────────────────┘
```

**After confirmation**, the row in the Review Screen updates to "confirmed" state:
```
┌────────────────────────────────────────┐
│ ✓ September 1, 2024 → June 1, 2026    │  ← text-green-400
│   11 occurrences confirmed             │  ← text-xs text-gray-400
│   [Edit] [Undo]                        │  ← ghost buttons, small
└────────────────────────────────────────┘
```

---

## Screen 5: Replacing (step = 'replacing')

```
┌─────────────────────────────────────────────┐
│  Applying 3 replacements...                 │  ← text-sm text-gray-400
│                                             │
│  ████████████████████████████████████████  │  ← Skeleton of change log
│  ████████████████  ████████                │
│  ████████████████████████                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Screen 6: Complete Screen (step = 'complete')

```
┌─────────────────────────────────────────────┐
│                                             │
│  ✓ Complete                                 │  ← text-green-400, text-xl
│  Balboa_Resolution_2024_updated.docx        │  ← text-sm text-gray-400
│                                             │
│  [Download .docx]                           │  ← Primary button — this is the ONE gradient CTA
│                                             │
│  ─── Change Log ─────────────────────────  │
│                                             │
│  September 1, 2024 → June 1, 2026    (11)  │  ← Each entry: text-sm text-gray-300
│  $84,116,000 → $90,000,000            (5)  │     count badge: text-xs text-gray-500
│  Series 2024-A → Series 2026-A         (7) │
│                                             │
│  Generated: Feb 18, 2026 at 11:42 AM       │  ← text-xs text-gray-500
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  [Process Another Document]                 │  ← Ghost button — resets to upload
│                                             │
└─────────────────────────────────────────────┘
```

**Download implementation:**
```typescript
// Convert base64 to blob and trigger browser download
const handleDownload = (base64: string, fileName: string) => {
  const bytes = atob(base64);
  const byteArray = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) byteArray[i] = bytes.charCodeAt(i);
  
  const blob = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace('.docx', '_updated.docx');
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## Error States

### Parse Failure (bad file, corrupted DOCX)

```
┌─────────────────────────────────────────────┐
│  ⚠  Could not parse this document           │  ← AlertTriangleIcon text-red-400
│                                             │
│  The file may be corrupted or in an         │
│  unsupported format. Only .docx files       │
│  from Microsoft Word are supported.         │
│                                             │
│  [Try a different file]                     │
│                                             │
└─────────────────────────────────────────────┘
```
Standard applied: `ERROR-UX-STANDARDS.md` — section banner, retry action, plain language.

### Replacement Integrity Failure (offset mismatch — abort)

```
┌─────────────────────────────────────────────┐
│  ✕  Replacement aborted — no changes made   │  ← AlertCircleIcon text-red-400
│                                             │
│  An unexpected mismatch was detected.       │
│  No changes were applied to your document.  │
│  The original file is unchanged.            │
│                                             │
│  [Start Over]    [Download original]        │
│                                             │
└─────────────────────────────────────────────┘
```

The key copy: **"No changes were applied to your document. The original file is unchanged."** This is the trust statement for the failure case.

---

## Component Inventory

| Component | Size Limit | Layer | Notes |
|-----------|-----------|-------|-------|
| `ToolCard` | < 60 lines | Component | Hub landing card |
| `UploadZone` | < 100 lines | Component | File drag-and-drop |
| `VariableGroupList` | < 80 lines | Component | Maps groups to rows |
| `VariableGroupRow` | < 120 lines | Component | Single row: text, count, actions |
| `PreviewPanel` | < 150 lines | Component | Occurrence navigator |
| `ReplaceForm` | < 80 lines | Component | Input + confirm |
| `ChangeLog` | < 80 lines | Component | Post-replacement summary |
| `Button` | < 60 lines | UI | All variants: primary, secondary, ghost, destructive |
| `Badge` | < 40 lines | UI | Status badges |
| `Skeleton` | < 40 lines | UI | Loading placeholder |
| `Input` | < 60 lines | UI | Text input with error state |

All size limits from `ELITE-STANDARDS.md`.

---

## Typography System for This Tool

```typescript
// Page title
"text-2xl sm:text-3xl font-bold text-white"

// Section headers (Dates, Dollar Amounts, etc.)
"text-xs font-semibold uppercase tracking-widest text-gray-500"

// Variable text (the detected value)
"text-sm font-medium text-white"

// Occurrence count
"text-xs text-gray-400"

// Body / descriptions
"text-sm text-gray-400"

// Microcopy (trust statement, hints)
"text-xs text-gray-500"

// Error text
"text-xs text-red-400"

// Success text
"text-sm text-green-400"
```

**Never go below `text-xs` (12px).** Never use gray-600 or darker for text on dark backgrounds (contrast fails WCAG AA).

---

## Accessibility Checklist for This Tool

- [ ] Upload zone keyboard accessible (Enter/Space to trigger file dialog)
- [ ] Preview Prev/Next buttons are focusable with keyboard
- [ ] "Exclude this occurrence" toggle has associated label
- [ ] Variable group action buttons have descriptive `aria-label` (not just "Replace" — "Replace: September 1, 2024")
- [ ] Error states use `role="alert"` for screen readers
- [ ] Locked groups have `aria-disabled="true"` on any replace UI that is hidden
- [ ] Change log uses `<table>` or semantic list structure
- [ ] Focus returns to appropriate element when Preview panel closes
- [ ] All text meets WCAG AA contrast (min 4.5:1 for body text)

---

**This UI spec, combined with `SPRINT-V1-ARCHITECTURE.md`, is sufficient for any developer or AI agent to build the complete Resolution Cleaner v1 from scratch without ambiguity.**
