# Loading Strategy Standards

**Authority:** Google web.dev, HTTP Archive Web Almanac 2025, Chrome UX Report (CrUX)  
**Philosophy:** Load what the user needs to see and touch first. Defer everything else.  
**Last Updated:** February 2026

---

## The Core Law

> The performance effects of too much lazy loading are real. Google's A/B testing proves that lazy loading above-the-fold images increases LCP by 13–18%. The fix is not to stop lazy loading — it is to be precise about what deserves to load eagerly.

Loading strategy is not a boolean (lazy or not lazy). It is a decision made per-resource based on **when the user needs it** and **what the cost of delay is**.

---

## Core Web Vitals Targets (MANDATORY)

These are the thresholds Google uses for "Good" performance. Every page must hit all three.

| Metric | What It Measures | Good | Needs Work | Poor |
|--------|-----------------|------|------------|------|
| **LCP** (Largest Contentful Paint) | How fast the main content loads | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | How fast the page responds to input | ≤ 200ms | 200–500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | How stable the layout is during load | ≤ 0.1 | 0.1–0.25 | > 0.25 |

**FID (First Input Delay) was retired in 2024. INP replaced it.** Do not reference FID in performance audits.

**TTFB (Time to First Byte)** target: ≤ 800ms. If TTFB is slow, LCP will always be slow regardless of other optimizations.

---

## The Critical Path Rule (MANDATORY)

Everything visible when the page first renders is on the critical path. It must load immediately.

**Critical path includes:**
- The largest image or text block in the hero section (the LCP element)
- Navigation and header content
- The first interactive control the user can engage with
- Any content above the fold at mobile viewport (375px height ≈ 667px)

**Not on the critical path (safe to defer):**
- Content below the fold
- Modals, drawers, and overlays (loaded on trigger)
- Charts, heavy data visualizations
- Content in tabs the user has not switched to
- Admin/settings pages
- Third-party embeds (social media, maps, chat widgets)

---

## The Lazy/Eager Decision Matrix

| Resource Type | Load Strategy | Reason |
|--------------|---------------|--------|
| Hero image / LCP image | **Eager** (`loading="eager"`, `fetchpriority="high"`) | Directly impacts LCP |
| Above-fold images | **Eager** | In viewport on first render |
| Below-fold images | **Lazy** (`loading="lazy"`) | Saves bytes on initial load |
| Background images (decorative) | **Lazy** (or CSS with `content-visibility: auto`) | Never on critical path |
| Font files (primary typeface) | **Preload** (`<link rel="preload">`) | Prevents FOUT |
| Font files (secondary/icon fonts) | **Default** browser behavior | Not critical |
| JavaScript bundles (primary page) | **Eager** — but code-split by route | Must execute to hydrate |
| JavaScript bundles (other routes) | **Lazy** (`next/dynamic`) | Not needed until navigation |
| Heavy components (charts, PDFs, rich editors) | **Dynamic import** | Never on initial bundle |
| Third-party scripts (analytics, chat) | **Deferred** (`strategy="lazyOnload"`) | Never block rendering |

---

## Image Loading Rules (MANDATORY)

### Rule 1: Never lazy-load the LCP image

The LCP element is almost always the hero image or the first large image. Lazy loading it causes the browser to discover it late in the parse, which directly delays LCP.

```typescript
// ✅ Hero image — ALWAYS eager
<Image
  src={heroImage}
  alt="..."
  priority // Next.js: adds fetchpriority="high" and preloads
  width={1200}
  height={600}
/>

// ✅ First content image — eager if above fold
<Image
  src={firstCardImage}
  alt="..."
  priority={isAboveFold} // conditionally eager
  loading={isAboveFold ? 'eager' : 'lazy'}
/>

// ✅ All other images — lazy
<Image
  src={belowFoldImage}
  alt="..."
  // Next.js defaults to lazy — do nothing
/>
```

### Rule 2: Always provide image dimensions

CLS (layout shift) is caused by images loading without reserved space. Every image needs width and height OR uses the `fill` prop with a sized container.

```typescript
// ✅ Fixed dimensions — no layout shift
<Image src={src} alt={alt} width={400} height={300} />

// ✅ Fill with container — no layout shift
<div className="relative h-48 w-full">
  <Image src={src} alt={alt} fill className="object-cover" />
</div>

// ❌ Missing dimensions — causes CLS
<img src={src} alt={alt} /> {/* Will shift layout when it loads */}
```

### Rule 3: Always provide `sizes` when using responsive layouts

```typescript
// ✅ Tells browser the actual render size at each breakpoint
<Image
  src={src}
  alt={alt}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>

// ❌ Browser downloads the full image even in a small card
<Image src={src} alt={alt} fill />
```

---

## JavaScript Code Splitting Rules (MANDATORY)

### Route-level splitting (automatic in Next.js App Router)

Next.js App Router handles route-level code splitting automatically. Each `page.tsx` is its own bundle. Do not fight this.

### Component-level splitting (`next/dynamic`)

Use dynamic imports for:
- Components that are never visible on the first paint
- Components that are conditionally rendered (modals, drawers)
- Heavy third-party integrations (rich text editors, chart libraries, map embeds)

```typescript
import dynamic from 'next/dynamic';

// ✅ Modal — never on initial paint
const SettingsModal = dynamic(() => import('./SettingsModal'));

// ✅ Chart — heavy library, only shown on interaction
const RevenueChart = dynamic(() => import('./RevenueChart'), {
  loading: () => <ChartSkeleton />, // Skeleton while loading
  ssr: false, // Charts often break in SSR — disable safely
});

// ✅ Rich text editor — large bundle
const RichEditor = dynamic(() => import('./RichEditor'), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full" />,
});
```

**`ssr: false` rule:** Only use when the component genuinely cannot render on the server (window access, browser-only APIs). Not as a lazy shortcut.

---

## Skeleton Screens vs Spinners (MANDATORY)

Skeleton screens are the correct default for content placeholders. Spinners are for actions.

| Scenario | Use | Reason |
|----------|-----|--------|
| Page/section content loading | Skeleton screen | Reduces perceived wait time, prevents CLS |
| Button submitting an action | Spinner inside button | Signals action is in progress |
| Full-page navigation | Skeleton of page layout | Prevents blank white flash |
| Modal opening with data fetch | Skeleton of modal content | Content area, not action |
| File upload in progress | Progress bar | Action with known progress |

```typescript
// ✅ Content loading — skeleton
function CardList({ status }: { status: Status }) {
  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  // ...
}

// ✅ Action in progress — spinner
<Button disabled={status === 'loading'}>
  {status === 'loading' ? (
    <><Spinner className="mr-2 h-4 w-4" /> Saving...</>
  ) : (
    'Save'
  )}
</Button>
```

---

## Third-Party Scripts (MANDATORY: Always Defer)

Third-party scripts are the single most common cause of INP regression. They run JavaScript on the main thread and block interactions.

**Never load third-party scripts synchronously in `<head>`.**

```typescript
// In Next.js app/layout.tsx

// ✅ Analytics — load after page is interactive
<Script src="https://..." strategy="lazyOnload" />

// ✅ Chat widget — load after user shows intent
<Script src="https://..." strategy="lazyOnload" />

// ✅ Necessary third-party (Stripe.js for payment) — load after first interaction
<Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />

// ❌ Blocks rendering
<Script src="https://..." strategy="beforeInteractive" /> // Only for critical polyfills
```

---

## Prefetch Strategy

Use prefetching to make subsequent navigation feel instant.

```typescript
// ✅ Next.js Link prefetches on hover by default — do not disable
<Link href="/dashboard">Dashboard</Link>

// ✅ Manually prefetch on hover intent (for non-Link elements)
import { useRouter } from 'next/navigation';

const router = useRouter();
<button
  onMouseEnter={() => router.prefetch('/reports')}
  onClick={() => router.push('/reports')}
>
  View Reports
</button>

// ❌ Disabling prefetch without reason
<Link href="/dashboard" prefetch={false}> {/* Only if page is gated behind auth check */}
```

---

## `content-visibility: auto` for Long Pages

For pages with many off-screen sections (dashboards, long lists, landing pages), `content-visibility: auto` tells the browser to skip rendering off-screen content until it is needed.

```css
/* In globals.css or component styles */
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* Estimated height to prevent layout shift */
}
```

**Performance impact:** Can reduce initial render time by 20–50% on content-heavy pages (Google web.dev data).

---

## No Flash of Empty Content (MANDATORY)

Every async content area must have a loading state. The user must never see a white or empty area where content will appear.

```typescript
// ✅ Always render something while loading
function Dashboard() {
  const { data, status } = useDashboardData();

  if (status === 'loading') return <DashboardSkeleton />;
  if (status === 'error') return <ErrorState />;
  if (!data) return <EmptyState />;

  return <DashboardContent data={data} />;
}

// ❌ Nothing while loading — jarring, causes CLS
function Dashboard() {
  const { data } = useDashboardData();
  if (!data) return null; // Flash of empty content
  return <DashboardContent data={data} />;
}
```

---

## Performance Audit Checklist (Before Every Release)

- [ ] LCP element does NOT have `loading="lazy"` or is missing `priority`
- [ ] All images have explicit dimensions (width/height or fill container)
- [ ] All images have `sizes` attribute when in responsive layouts
- [ ] Heavy components use `next/dynamic` with skeleton fallbacks
- [ ] Third-party scripts use `strategy="lazyOnload"`
- [ ] No spinner used for content loading (skeleton only)
- [ ] Every async state has a loading, error, and empty state
- [ ] Run Lighthouse in Chrome DevTools — LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Check CrUX field data (real users) in Google Search Console

---

## Measuring Performance

**Lab data (development):** Lighthouse in Chrome DevTools or `npm run build && npx lighthouse`  
**Field data (production):** Google Search Console → Core Web Vitals report  
**Both are required.** Lab data finds issues in development. Field data validates real-world performance.

```typescript
// Optional: Log LCP element in development to find violations
if (process.env.NODE_ENV === 'development') {
  new PerformanceObserver((list) => {
    const latest = list.getEntries().at(-1) as LargestContentfulPaint;
    if (latest?.element?.getAttribute('loading') === 'lazy') {
      console.warn('LCP element is lazy-loaded — fix this immediately', latest.element);
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}
```

---

**Sources:** Google web.dev "The performance effects of too much lazy loading", HTTP Archive Web Almanac 2025 Performance chapter, Google Core Web Vitals documentation, Linkgraph Advanced Core Web Vitals Guide
