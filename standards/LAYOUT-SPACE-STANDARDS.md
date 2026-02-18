# Layout and Space Standards

**Authority:** Atlassian Design System, Microsoft Power Platform Well-Architected, Interaction Design Foundation, WCAG 2.2 (1.4.10 Reflow)  
**Philosophy:** Space is not empty. It is the structure that makes everything else readable.  
**Last Updated:** February 2026

---

## The Core Law

> Users form impressions of a page within 50 milliseconds. That impression is driven by spacing, structure, and symmetry — before they have read a single word.

White space is not wasted space. It is:
- The container that gives other elements meaning
- The signal that separates ideas
- The breath that prevents cognitive overload

Research from human-computer interaction shows that users consistently rate designs with appropriate whitespace as less demanding and more professional. But "more whitespace" alone is not the answer — *strategic* placement that supports visual hierarchy is what creates clarity.

---

## The 8-Point Grid (MANDATORY)

All spacing values in this codebase use multiples of 8 (the 8-point grid). Tailwind's default spacing scale maps perfectly to this system.

| Scale Value | Pixels | Tailwind Class | Use For |
|------------|--------|----------------|---------|
| 1 | 4px | `p-1`, `gap-1` | Icon padding, tight micro-spacing |
| 2 | 8px | `p-2`, `gap-2` | Inline element spacing, small gaps |
| 3 | 12px | `p-3`, `gap-3` | Button padding, compact elements |
| 4 | 16px | `p-4`, `gap-4` | Default component padding |
| 5 | 20px | `p-5`, `gap-5` | Card content area |
| 6 | 24px | `p-6`, `gap-6` | Card padding, section sub-spacing |
| 8 | 32px | `p-8`, `gap-8` | Section breaks within a page section |
| 10 | 40px | `p-10` | Generous card or panel padding |
| 12 | 48px | `py-12` | Mobile section vertical spacing |
| 16 | 64px | `py-16` | Desktop section vertical spacing |
| 20 | 80px | `py-20` | Hero and major section spacing |
| 24 | 96px | `py-24` | Maximum breathing room, landing pages |

**Never use arbitrary spacing values like `p-[13px]` or `mt-[27px]`.** If the grid does not fit, the design needs to be reconsidered.

---

## Page Anatomy (MANDATORY)

Every page is composed of these zones, in this order:

```
┌─────────────────────────────────────────────────────────┐
│  NAVIGATION (sticky or static — fixed height)           │
├─────────────────────────────────────────────────────────┤
│  PAGE HEADER ZONE (title, breadcrumb, page actions)     │
│  Padding: py-6 to py-10 | Content max-w: 7xl           │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT ZONE (the primary purpose of the page)    │
│  Takes up the most vertical space                       │
│  Content max-w: varies by page type (see below)        │
├─────────────────────────────────────────────────────────┤
│  SECONDARY CONTENT ZONE (sidebar, related, metadata)    │
│  Optional — present on detail/dashboard pages only     │
├─────────────────────────────────────────────────────────┤
│  PAGE FOOTER ZONE (actions, pagination, contextual nav) │
│  Padding: py-8 to py-12                                │
└─────────────────────────────────────────────────────────┘
```

---

## Content Max-Width Ladder (MANDATORY)

Choosing the wrong max-width is the most common reason pages feel cramped or too spread out.

| Width Class | Max Width | Use For | Never Use For |
|------------|-----------|---------|---------------|
| `max-w-7xl` | 1280px | Full page wrapper, dashboards, data-heavy pages | Single column reading content |
| `max-w-5xl` | 1024px | Feature sections, split layouts (content + sidebar) | Long-form reading |
| `max-w-3xl` | 768px | Forms, focused single-column flows, sign-up/checkout | Dashboards or data grids |
| `max-w-2xl` | 672px | Modals, dialogs, confirmation screens | Wide data tables |
| `max-w-prose` | ~65ch | Articles, help docs, long-form instructions | App UI |
| `max-w-sm` | 384px | Narrow modals, alert dialogs, cards | Page sections |

**The `max-w-prose` (~65 characters per line) is the scientifically optimal line length for readability.** Research shows that lines between 45–75 characters minimize reader fatigue. Never let body text stretch beyond ~80 characters per line.

```typescript
// ✅ Page wrapper
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// ✅ Form page — focused, not wide
<div className="max-w-3xl mx-auto">
  <FormContent />
</div>

// ✅ Reading content
<article className="max-w-prose mx-auto">
  <LongFormContent />
</article>

// ❌ Body text at full page width
<main className="w-full px-8">
  <p>Long text that stretches 200 characters across the screen...</p>
</main>
```

---

## Section Spacing (MANDATORY)

Sections must breathe. Cramped sections feel unpolished. Sections that are too separated feel disconnected.

### Vertical Section Spacing

```typescript
// ✅ Landing/marketing page sections (generous breathing room)
<section className="py-16 sm:py-20 lg:py-24">

// ✅ App dashboard sections (functional, less theatrical)
<section className="py-8 sm:py-12">

// ✅ Form sections / grouped fields
<fieldset className="py-6 space-y-4">

// ❌ Sections stacked without breathing room
<section className="py-2">
```

### Section Internal Spacing

```typescript
// ✅ Heading → content gap
<div className="space-y-6">
  <div> {/* Heading group */}
    <h2 className="text-2xl font-bold">Section Title</h2>
    <p className="mt-2 text-gray-400">Supporting description.</p>
  </div>
  <div> {/* Content */}
    ...
  </div>
</div>

// ✅ Heading-to-content: mt-4 to mt-8 depending on section size
// ✅ Paragraph-to-paragraph: space-y-4
// ✅ Label-to-input: gap-1 to gap-2
// ✅ Input-to-error: gap-1
// ✅ Form field groups: gap-4 to gap-6
```

---

## Grid and Layout Patterns

### Information Density Levels

Choose the right density for the content type.

| Density | Tailwind Gap | Padding | Use For |
|---------|-------------|---------|---------|
| **Dense** | `gap-2` to `gap-4` | `p-3` to `p-4` | Data tables, spreadsheet-like views, code |
| **Standard** | `gap-4` to `gap-6` | `p-4` to `p-6` | App dashboards, cards, forms |
| **Spacious** | `gap-6` to `gap-8` | `p-6` to `p-8` | Marketing, landing pages, feature showcases |
| **Airy** | `gap-8`+ | `p-8`+ | Hero sections, large CTAs, minimal UI |

**Never mix density levels within a single view without purpose.** A dense data table next to a spacious card layout creates visual tension.

### Grid Patterns by Content Type

```typescript
// ✅ Feature/benefit cards (marketing)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

// ✅ Data summary cards (dashboard)
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">

// ✅ Form + preview (split layout)
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8">

// ✅ Content + sidebar (detail page)
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
```

---

## The Anti-Patterns (FORBIDDEN)

These are the most common space failures that make apps look unpolished.

### Anti-Pattern 1: Content Touching Edges

```typescript
// ❌ No padding — content cuts off at edges
<div className="w-full">
  <h1>Title</h1>
</div>

// ✅ Always pad from edges
<div className="w-full px-4 sm:px-6 lg:px-8">
  <h1>Title</h1>
</div>
```

### Anti-Pattern 2: Two Competing Focal Points

Every section should have ONE primary visual anchor. If a section has two elements competing for attention (two large gradients, two big headings, two buttons of equal weight), the user does not know where to look.

```typescript
// ❌ Two primary CTAs competing equally
<div className="flex gap-4">
  <Button variant="primary" size="lg">Start Free Trial</Button>
  <Button variant="primary" size="lg">Contact Sales</Button>
</div>

// ✅ Clear hierarchy — primary + secondary
<div className="flex gap-4">
  <Button variant="primary" size="lg">Start Free Trial</Button>    {/* Dominant */}
  <Button variant="secondary" size="lg">Contact Sales</Button>     {/* Subordinate */}
</div>
```

### Anti-Pattern 3: Vertical Margin Collapse Surprises

Use `space-y-*` on parent containers instead of `mb-*` on individual children. This avoids margin collapse issues and is more predictable.

```typescript
// ❌ Margin on each child — collapse surprises, hard to override
<div>
  <h2 className="mb-4">Title</h2>
  <p className="mb-4">Text</p>
  <Button className="mb-4">Action</Button>
</div>

// ✅ Gap on parent — clean, predictable
<div className="space-y-4">
  <h2>Title</h2>
  <p>Text</p>
  <Button>Action</Button>
</div>
```

### Anti-Pattern 4: Hardcoded Heights for Dynamic Content

```typescript
// ❌ Breaks when content changes length
<div className="h-48 overflow-hidden">
  <DynamicContent />
</div>

// ✅ Min-height with auto expansion
<div className="min-h-48">
  <DynamicContent />
</div>
```

### Anti-Pattern 5: Full-Bleed Text on Wide Screens

```typescript
// ❌ Text spans 200+ characters at 1920px wide
<section className="w-full p-8">
  <p>{longText}</p>
</section>

// ✅ Content constrained, background can be full-bleed
<section className="w-full bg-gray-900 py-16">
  <div className="max-w-prose mx-auto px-4">
    <p>{longText}</p>
  </div>
</section>
```

---

## Z-Axis Layering (Depth)

Layering creates visual hierarchy on the z-axis. Every element should have a clear layer assignment.

| Layer | z-index | Elements |
|-------|---------|----------|
| Base | 0 | Page content, cards, sections |
| Sticky | 10 | Sticky headers, sticky sidebars |
| Dropdown | 20 | Select menus, command palettes |
| Overlay | 30 | Modal backdrops |
| Modal | 40 | Modals, dialogs, drawers |
| Toast | 50 | Toast notifications |
| Tooltip | 60 | Tooltips (must clear everything) |

```typescript
// In Tailwind config or globals — define consistent z-index tokens
// z-10 = sticky elements
// z-20 = dropdowns
// z-30 = backdrops
// z-40 = modals
// z-50 = toasts
// z-60 = tooltips
```

---

## Responsive Spacing Rules

Spacing should scale with the viewport. Dense on mobile (space is precious), more generous on desktop.

```typescript
// ✅ Section padding scales up
<section className="py-10 sm:py-14 lg:py-20">

// ✅ Card gap scales up
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">

// ✅ Page padding scales up
<div className="px-4 sm:px-6 lg:px-8">

// ❌ Same spacing regardless of screen size
<section className="py-24">  // Too much padding on mobile
```

---

## Layout Checklist (Before Every Commit)

- [ ] Page uses `max-w-7xl mx-auto` wrapper (or appropriate narrower max-w)
- [ ] Content never touches screen edges (minimum `px-4` on mobile)
- [ ] Sections have appropriate vertical padding (`py-10`+ for sections)
- [ ] No competing focal points — clear visual hierarchy in each section
- [ ] Grid uses `gap-4` to `gap-8` (not `gap-1` or `gap-2` for layout grids)
- [ ] Body text constrained to `max-w-prose` or equivalent for readability
- [ ] No hardcoded pixel heights on dynamic content containers
- [ ] Space scales responsively (larger gaps on desktop than mobile)
- [ ] Z-index uses the standard layer table — no magic numbers

---

**Sources:** Atlassian Design System Spacing Foundations, Microsoft Power Platform Visual Design Well-Architected, WCAG 2.1 Success Criterion 1.4.10 (Reflow), Interaction Design Foundation "The Power of White Space", SAGE Journals human-computer interaction whitespace research
