# Color and Visual Restraint Standards

**Authority:** WCAG 2.2 (1.4.1, 1.4.3, 1.4.11), ACM eye-tracking research 2025, Interaction Design Foundation, Nielsen Norman Group  
**Philosophy:** Color is a signal. Use it only when you have something to say. Silence is powerful.  
**Last Updated:** February 2026

---

## The Core Law

> Eye-tracking research confirms that color-coded elements receive significantly more fixations and longer gaze durations — which sounds positive until you realize that means increased cognitive load for every non-essential color element you add.

Color grabs attention. That is its power. But when everything grabs attention, nothing does. The most effective interfaces use color with restraint, reserving its impact for the moments that matter: a call to action, a status signal, a state change, a brand moment.

**The rule: Every use of brand color must serve a function. If removing it does not hurt clarity, it should not be there.**

---

## The Color Budget per Viewport (MANDATORY)

A viewport is what the user sees without scrolling. Every viewport has a color budget.

| Color Element | Max Per Viewport | Notes |
|--------------|-----------------|-------|
| Gradient elements (backgrounds, buttons) | 2 | Hero gradient + one CTA maximum |
| Brand accent (mint, primary color) | 3–4 distinct uses | Icon accent + one text highlight + one border |
| Status colors (red/green/amber) | As needed | These are functional, not decorative |
| White/gray content text | Unlimited | This is the baseline, not a "color use" |

**If you are counting more than 4 distinct brand color applications in one viewport, pull back. The page is loud.**

---

## Color Roles (MANDATORY — Each Color Has One Job)

Every color in the design system has an assigned role. Do not use a color outside its role.

### Brand Colors (Purposive Use Only)

| Color | Role | Forbidden Use |
|-------|------|--------------|
| Primary (purple) | Primary CTA backgrounds, gradients, major headings (with white text) | Body text, borders on every card, backgrounds of small elements |
| Accent (mint/turquoise) | Hover states, active indicators, one highlight word per heading, icon accents | Background colors, borders on every element, more than 3× per viewport |
| Blue (secondary) | Links, interactive indicators, informational states | Primary CTA, decorative only |

### Semantic / Functional Colors (Non-Negotiable Roles)

These colors communicate system state. Never repurpose them for decoration.

| Color | Role | Why |
|-------|------|-----|
| Red / `red-400` to `red-600` | Error states, destructive actions only | Red = danger — repurposing breaks the signal |
| Green / `green-400` to `green-600` | Success states, positive validation, completion | Green = good — decorative green confuses users |
| Amber / `amber-400` to `amber-500` | Warning states, caution | Amber = caution — do not use for emphasis |
| Blue / `blue-400` to `blue-500` | Info states, links | Already used for interaction cues |

**Never use the primary brand purple for error/success/warning states.** Using purple for "success" destroys the semantic meaning of your brand color.

---

## The Color Restraint Rules

### Rule 1: Gradient Appears at Most Twice Per Page Section

A gradient is a premium visual signal. It should mark the highest-priority moment in a section.

```typescript
// ✅ One gradient CTA per hero section
<Button className="bg-gradient-to-r from-primary-600 to-blue-600 text-white">
  Start Free Trial
</Button>

// ❌ Every button is a gradient
<Button className="bg-gradient-to-r from-primary-600 to-blue-600">Primary</Button>
<Button className="bg-gradient-to-r from-blue-600 to-cyan-600">Secondary</Button>  // ❌
<Button className="bg-gradient-to-r from-green-600 to-teal-600">Tertiary</Button>  // ❌

// ✅ Correct hierarchy
<Button className="bg-gradient-to-r from-primary-600 to-blue-600">Primary</Button>
<Button className="border border-primary/50 text-primary">Secondary</Button>
<Button className="text-gray-400 hover:text-white">Tertiary</Button>
```

### Rule 2: Accent Color is a Highlight, Not a Default

Accent color has maximum impact precisely because it appears rarely. When every card border, every icon, every heading uses the accent color, it loses all meaning.

```typescript
// ❌ Accent everywhere — diluted impact
<div className="border border-mint text-mint">
  <h3 className="text-mint">Card Title</h3>
  <p>Content</p>
  <Button className="text-mint border-mint">Learn More</Button>
</div>

// ✅ Accent used once, with purpose
<div className="border border-gray-800 hover:border-mint/50 transition-colors">
  <h3 className="text-white">Card Title</h3>        {/* White — not fighting for attention */}
  <p className="text-gray-400">Content</p>
  <Button className="text-mint hover:text-white">Learn More</Button>  {/* One accent use */}
</div>
```

### Rule 3: The 60/30/10 Color Distribution

A balanced interface uses:
- **60%** neutral (black, dark gray, white, light gray)
- **30%** secondary colors (mid-range brand colors, subtle tints)
- **10%** accent (the brightest, most impactful brand color)

If your accent is appearing in more than ~10% of the visual space, the page is saturated.

### Rule 4: Glow Effects Are Reserved for Interaction States

Glow and shadow effects amplify the perceived intensity of a color. If glows are on static elements (not just hover/active states), they add visual weight permanently.

```typescript
// ✅ Glow appears on hover — dynamic, not static noise
<button className="
  bg-primary text-white
  shadow-none
  hover:shadow-[0_0_20px_rgba(88,0,103,0.5)]  {/* Glow only on hover */}
  transition-shadow
">

// ❌ Always-on glow on every card
<div className="
  bg-gray-900
  shadow-[0_0_30px_rgba(88,0,103,0.3)]  {/* Permanent purple glow on every card */}
">
```

### Rule 5: Background Gradients Must Be Subtle

A background gradient's job is to add depth, not to compete with content. Background gradients should be nearly invisible — if you removed them, the page would look almost identical.

```typescript
// ✅ Subtle radial gradient — adds depth without competing
<section className="bg-black">
  <div
    className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,0,103,0.08)_0%,transparent_70%)]"
    aria-hidden="true"
  />
  {/* Content */}
</section>

// ❌ Aggressive gradient that becomes the focal point
<section className="bg-gradient-to-b from-purple-900 to-black">
  {/* The gradient is now more prominent than the content */}
</section>
```

---

## Color Behavior Across Screen Sizes

Colors behave differently on small screens. Saturated colors on mobile feel heavier because they fill a larger proportion of the visual field.

```typescript
// ✅ Reduce saturation/intensity on mobile when needed
<div className="
  bg-gradient-to-r from-primary/60 to-blue-600/60  {/* Mobile: 60% opacity */}
  sm:from-primary sm:to-blue-600                    {/* Desktop: full intensity */}
">

// ✅ Reduce background tints on mobile
<section className="
  bg-gray-950
  sm:bg-gradient-to-br sm:from-gray-950 sm:to-primary/5  {/* Only show on larger screens */}
">
```

---

## WCAG Contrast Requirements (MANDATORY)

Per WCAG 2.2:
- **1.4.3 Contrast (Minimum):** Normal text: 4.5:1. Large text (18pt+ or 14pt bold+): 3:1.
- **1.4.6 Contrast (Enhanced):** Normal text: 7:1 (AAA — target this for body text).
- **1.4.11 Non-text Contrast:** UI components (buttons, inputs, icons) and graphical objects: 3:1.

| Combination | Contrast Ratio | WCAG Level |
|-------------|---------------|------------|
| White on Black | 21:1 | AAA |
| White on gray-900 (`#111`) | 17:1 | AAA |
| gray-300 on Black | 9.8:1 | AAA |
| Mint on Black | 12.3:1 | AAA |
| Purple on Black | 3.2:1 | Fail for text (use for backgrounds only) |
| gray-400 on gray-900 | ~4.6:1 | AA |
| gray-500 on gray-900 | ~3.1:1 | AA for large text only |

**Brand purple (`#580067`) must never be used as text color on dark backgrounds.** Its contrast ratio of 3.2:1 fails WCAG AA for normal-size text. Use it for backgrounds, gradients, and accents only.

```typescript
// ✅ Purple in gradient (background) — no text contrast issue
<div className="bg-gradient-to-r from-primary to-blue-600">
  <span className="text-white">White text on gradient — passes</span>
</div>

// ❌ Purple text on dark background — fails WCAG AA
<p className="text-primary">Purple text on dark background</p>

// ✅ Use mint or white for accent text instead
<p className="text-mint">Mint text on dark background — 12.3:1 — passes AAA</p>
```

---

## Dark Mode Saturation Rule

Dark backgrounds amplify perceived color saturation. A color that looks subtle on white can appear aggressive on near-black backgrounds.

When working in dark mode (which this design system uses by default):
- **Reduce tint opacity by 30–50%** for background overlays vs what you would use on light mode
- **Avoid deeply saturated fills** on large areas — prefer near-black with a subtle brand tint
- **Reserve full-saturation color** for icons, text accents, and small UI controls

```typescript
// ✅ Dark mode: subtle brand tint for large areas
<div className="bg-primary/5">  // 5% opacity — noticeable but not overwhelming

// ✅ Dark mode: full saturation only for small UI elements
<Badge className="bg-primary text-white">  // Small badge — full color is fine
```

---

## State Color Map (MANDATORY — Never Deviate)

These are the only colors that communicate application state. Do not use brand colors for state communication.

| State | Color Tokens | Background | Text/Icon |
|-------|-------------|------------|-----------|
| Success / Completed | green-500 / green-400 | green-950/20 | green-400 |
| Error / Failed | red-500 / red-400 | red-950/20 | red-400 |
| Warning / Caution | amber-500 / amber-400 | amber-950/20 | amber-400 |
| Info / Note | blue-500 / blue-400 | blue-950/20 | blue-400 |
| Inactive / Disabled | gray-600 | gray-800 | gray-500 |
| Loading / Pending | primary color | — | Use skeleton or spinner |

```typescript
// ✅ Status badge using semantic colors
const statusStyles = {
  active:    'bg-green-950/20 text-green-400 border-green-800/50',
  pending:   'bg-amber-950/20 text-amber-400 border-amber-800/50',
  failed:    'bg-red-950/20 text-red-400 border-red-800/50',
  cancelled: 'bg-gray-800 text-gray-400 border-gray-700',
} as const;

// ❌ Using brand colors for status
const badStatusStyles = {
  active:  'bg-primary/20 text-mint',   // ❌ Brand color for state = confusing
  pending: 'bg-blue-600 text-white',     // ❌ Links are blue — now status is also blue
};
```

---

## Animation and Color Together

When color transitions happen in animations, they add to cognitive load. Keep animated color changes simple.

```typescript
// ✅ Transition only one color property at a time
<button className="
  bg-gray-800 text-white
  hover:bg-primary hover:text-white
  transition-colors duration-200
">

// ❌ Multiple color transitions + transform + shadow simultaneously
<button className="
  bg-gray-800
  hover:bg-gradient-to-r hover:from-primary hover:to-blue-600
  hover:text-mint
  hover:shadow-purple-lg
  hover:scale-105
  transition-all duration-300
">
// Animating 5 properties at once is overwhelming
```

**Respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## The Color Audit Test (Run on Every Page Before Shipping)

Look at the page and count:

1. **How many brand color applications exist in the first viewport?** Target: ≤ 4
2. **Are there more than 2 gradient elements visible at once?** If yes: consolidate
3. **Does every use of accent color have a purpose?** If you cannot name the purpose, remove it
4. **Is purple used as body text anywhere?** If yes: change to white or gray-300
5. **Are all status indicators using semantic colors (red/green/amber/blue)?** If no: fix
6. **Does the page look "loud"?** Stand 3 feet from your monitor. Does the color draw your eye to the most important thing, or does everything compete equally? If everything competes: reduce

---

## Color Checklist (Before Every Commit)

- [ ] Gradient appears ≤ 2 times per page section
- [ ] Accent color appears ≤ 3–4 times per viewport
- [ ] Brand purple not used as text color on dark backgrounds
- [ ] Status colors are semantic only (red=error, green=success, amber=warning, blue=info)
- [ ] Glow effects only appear on hover/active states, not static
- [ ] Background gradients pass the "almost invisible" test
- [ ] All text meets WCAG AA contrast (4.5:1 for body, 3:1 for large text)
- [ ] UI elements (buttons, inputs) meet 3:1 non-text contrast
- [ ] `prefers-reduced-motion` respected in CSS
- [ ] No color carries meaning without also a text/icon indicator (WCAG 1.4.1)

---

**Sources:** ACM Eye-Tracking Study on Dark/Light Themes (2025), Graphics Interface "Baseline Study of Emphasis Effects" (2020), Springer "Visual design intervention for cognitive load" (2025), WCAG 2.2 Success Criteria 1.4.1, 1.4.3, 1.4.6, 1.4.11, Interaction Design Foundation "The Power of White Space"
