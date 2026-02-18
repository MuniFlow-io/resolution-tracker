# Responsive Design Standards

**Authority:** W3C WCAG 2.2, MDN Web Docs, Google web.dev  
**Philosophy:** Every component is born mobile. Desktop is the enhancement.  
**Last Updated:** February 2026

---

## The Core Law

> HTML is natively responsive. Every pixel of complexity you add with CSS is a debt you owe every screen size.

Mobile-first is not a style preference. It is the only correct development order. When you write CSS for desktop first and then shrink it down, you are doing twice the work and creating fragile layouts. When you write for mobile first and scale up, you are building on the smallest constraint and relaxing it — which is always easier than adding constraints after the fact.

**As of 2026, mobile accounts for 60%+ of global web traffic.** Building desktop-first is building for the minority first.

---

## Breakpoint System (MANDATORY)

Use Tailwind's default breakpoint scale. Do not invent custom breakpoints.

| Prefix | Min Width | Target Device Context |
|--------|-----------|----------------------|
| (none) | 0px | Mobile portrait — the default |
| `sm`   | 640px | Mobile landscape / small tablet |
| `md`   | 768px | Tablet portrait |
| `lg`   | 1024px | Tablet landscape / small laptop |
| `xl`   | 1280px | Desktop |
| `2xl`  | 1536px | Large desktop / wide monitor |

### Rules for Breakpoint Usage

- **Write mobile styles first, then add `md:`, `lg:`, `xl:` overrides** — never reverse this
- Do not use arbitrary values like `[500px]` for layout breakpoints — use the standard scale
- If a layout only changes at `xl`, you do not need `sm`, `md`, or `lg` variants
- Custom breakpoints are allowed only for micro-adjustments (e.g., a tooltip that overflows at exactly one size) — document them inline with a comment

```typescript
// ✅ Mobile-first: starts stacked, goes side-by-side at md
<div className="flex flex-col md:flex-row gap-4">

// ❌ Assumed desktop, patched for mobile
<div className="flex flex-row md:flex-col gap-4">
```

---

## Container and Max-Width Standards (MANDATORY)

Every page and section must use a consistent container system. Content should never stretch edge-to-edge at large viewports.

| Container Class | Max Width | Use For |
|----------------|-----------|---------|
| `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | 1280px | Full page wrapper, navigation, footer |
| `max-w-5xl mx-auto` | 1024px | Feature sections, content-heavy pages |
| `max-w-3xl mx-auto` | 768px | Article content, forms, single-column focused content |
| `max-w-prose mx-auto` | ~65ch | Long-form text (blog, docs, instructions) |

### Padding Rules

- Mobile: `px-4` (16px) minimum — content must never touch screen edges
- Tablet: `sm:px-6` (24px)
- Desktop: `lg:px-8` (32px)
- Never use `px-0` on the outermost container at mobile

```typescript
// ✅ Correct page wrapper
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</main>
```

---

## Responsive Component Patterns

### Pattern 1: Stack → Row (Most Common)

Items stack vertically on mobile and go horizontal on tablet/desktop.

```typescript
// Cards grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

// Action buttons
<div className="flex flex-col sm:flex-row gap-3">

// Form + preview side-by-side
<div className="flex flex-col lg:flex-row gap-8">
```

### Pattern 2: Adaptive Text Size

Typography must scale down for mobile without becoming unreadable.

```typescript
// Page headline
<h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">

// Section heading
<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">

// Card title
<h3 className="text-lg sm:text-xl font-medium">

// Body text — do NOT scale body text. 16px (text-base) is the minimum readable size.
<p className="text-base leading-relaxed">
```

**Minimum readable font size: 16px (`text-base`). Never go below this for body text on mobile.**

### Pattern 3: Show/Hide by Breakpoint

Some elements only make sense at certain sizes.

```typescript
// Show on desktop, hide on mobile
<div className="hidden lg:block">
  <Sidebar />
</div>

// Show on mobile, hide on desktop (mobile nav, compact controls)
<div className="block lg:hidden">
  <MobileNav />
</div>
```

**Do not hide content that users need.** If it is hidden on mobile, it must exist somewhere else (hamburger menu, accordion, etc.) — never just removed.

### Pattern 4: Responsive Hook (`useBreakpoint`)

When layout logic needs to live in a hook (not CSS), use a single standardized hook.

```typescript
// hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('mobile');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// Usage in hook (not component)
const breakpoint = useBreakpoint();
const isMobile = breakpoint === 'mobile' || breakpoint === 'sm';
```

**Use `useBreakpoint` only for logic that cannot be achieved with Tailwind classes.** CSS media queries are always preferred over JavaScript for layout.

---

## Touch Target Standards (WCAG 2.2 Requirement)

Per WCAG 2.2 Success Criterion 2.5.8, touch targets must be:
- **Minimum 24×24 CSS pixels** (WCAG AA)
- **Target: 44×44 CSS pixels** (WCAG AAA, Apple HIG, Google Material)

```typescript
// ✅ Button always meets minimum touch target
<button className="min-h-[44px] min-w-[44px] px-4 py-2">

// ✅ Icon button — use padding to expand hit area
<button className="p-3 rounded-lg"> {/* 44px total with 20px icon */}
  <Icon className="w-5 h-5" />
</button>

// ❌ Too small for touch
<button className="p-1">
  <Icon className="w-4 h-4" /> {/* 24px total — fails WCAG 2.2 */}
</button>
```

---

## Responsive Image Standards

```typescript
// ✅ Images always constrained to container
<img className="w-full h-auto object-cover" />

// ✅ Next.js Image with responsive sizes
<Image
  src={src}
  alt={alt}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>

// ❌ Fixed pixel width that overflows on mobile
<img width={800} />
```

**Always provide `sizes` attribute on Next.js `<Image>` when using responsive layouts.** Without it, the browser downloads the largest image regardless of viewport.

---

## Reflow and Horizontal Scroll (FORBIDDEN)

Per WCAG 2.1 Success Criterion 1.4.10 (Reflow):
- Content must reflow to a single column at 320 CSS pixels viewport width without horizontal scrolling
- No element may create horizontal overflow at any viewport width

```typescript
// ✅ Text wraps naturally
<p className="break-words">

// ✅ Tables scroll within container, not the page
<div className="overflow-x-auto">
  <table>...</table>
</div>

// ❌ Fixed width wider than viewport
<div className="w-[900px]">

// ❌ Using overflow-x-hidden to hide the problem
<div className="overflow-x-hidden"> {/* This is a band-aid, not a fix */}
```

---

## Responsive Component Template

Every new component must be built with this mobile-first structure:

```typescript
interface MyComponentProps {
  data: MyData;
  className?: string; // Always accept className for layout flexibility
}

export function MyComponent({ data, className }: MyComponentProps) {
  return (
    // Outer: constrain layout via parent, accept className override
    <div className={cn('w-full', className)}>

      {/* Mobile-first: single column, scales to multi-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">

        {/* Text scales from mobile to desktop */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
          {data.title}
        </h2>

        {/* Actions stack on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="w-full sm:w-auto">Primary</Button>
          <Button variant="secondary" className="w-full sm:w-auto">Secondary</Button>
        </div>
      </div>
    </div>
  );
}
```

**`className` prop is REQUIRED on every component.** Composable layout requires the ability to override from the outside.

---

## The Responsive Checklist (Before Every Commit)

- [ ] Component written mobile-first (no desktop-only assumptions in base styles)
- [ ] No hardcoded pixel widths on layout elements
- [ ] No horizontal overflow created at 320px viewport
- [ ] Touch targets are minimum 44×44px
- [ ] Images use `w-full h-auto` or Next.js `<Image>` with `sizes`
- [ ] Text does not go below `text-base` (16px) on any screen
- [ ] Hidden elements have a mobile equivalent (not just removed)
- [ ] `className` prop accepted for external layout control
- [ ] Tested at: 375px (iPhone), 768px (iPad), 1280px (desktop)

---

## What "Responsive" Is Not

- **Not just making it smaller.** Responsive means rethinking the layout, not shrinking desktop to fit.
- **Not just hiding things.** Hiding content on mobile means the user is missing it.
- **Not just using `sm:` everywhere.** Most components only need 1–2 breakpoints. Using all 5 on everything is noise.
- **Not a CSS afterthought.** Responsiveness is designed before the first line of code is written.

---

**Sources:** W3C WCAG 2.2 (Reflow 1.4.10, Target Size 2.5.8), MDN Responsive Design Guide, Google web.dev Learn Design, Apple Human Interface Guidelines, Google Material Design 3
