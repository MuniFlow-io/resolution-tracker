# Open Source Library Strategy

**Authority:** OpenSSF Best Practices Working Group, Bundlephobia, npm ecosystem research 2025  
**Philosophy:** Every dependency is a long-term commitment and a security surface. Choose deliberately.  
**Last Updated:** February 2026

---

## The Core Law

> "The best dependency is no dependency." — Every principal engineer at every major company

Before adding a library, ask: **Can this be solved in under 50 lines of native code?** If yes, write it. If no, find the best library. The cost of a dependency is not just the initial `npm install` — it is every security audit, every breaking change, every update, and every increase to your bundle size for the lifetime of the project.

---

## The Build-vs-Buy Decision

| Criteria | Build It | Use a Library |
|----------|----------|---------------|
| Feature is < 50 lines | Yes | No |
| Feature is core domain logic | Yes | No |
| Feature needs to be deeply customized | Often yes | Only if highly configurable |
| Feature is well-solved, non-trivial | No | Yes |
| Feature is security-sensitive (crypto, auth) | Never build | Always use trusted library |
| Feature requires years of edge-case handling | No | Yes |

**Examples:**
- Debounce function → Build it (5 lines)
- Fuzzy search over 10,000 records → Use Fuse.js
- Date formatting → Use date-fns
- Full auth system → Use Supabase Auth

---

## Library Evaluation Criteria (MANDATORY before adding any dependency)

Before adding any library, verify all of these:

### 1. Activity and Maintenance

- Last commit: within 12 months? If not, is it intentionally "finished" (like a stable utility)?
- Open issues: are maintainers responding within reasonable time?
- Multiple active maintainers? (Single-maintainer projects are higher abandonment risk)
- Has the project had breaking changes recently without migration guides?

**Tools:** Check the GitHub repository directly. Check `npm` for weekly download trend.

### 2. Bundle Size (MANDATORY check)

Use **Bundlephobia** (bundlephobia.com) to check:
- Minified size
- Minified + gzipped size
- Tree-shaking support

| Bundle Size | Verdict |
|------------|---------|
| < 5 KB gzipped | Green — add freely |
| 5–20 KB gzipped | Yellow — worth it only if well-used |
| 20–50 KB gzipped | Orange — consider alternatives or dynamic import |
| > 50 KB gzipped | Red — requires strong justification and must be dynamically imported |

### 3. TypeScript Support

- First-party TypeScript types? (preferred)
- High-quality `@types/` package? (acceptable)
- No types at all? (requires justification — never for core dependencies)

### 4. Dependency Footprint

- How many transitive dependencies does it bring?
- Does it require polyfills that inflate bundle?
- Does it duplicate something you already have (e.g., lodash if you have date-fns)?

### 5. License

| License | Can Use? |
|---------|----------|
| MIT | Yes — always |
| Apache 2.0 | Yes |
| BSD 2/3-Clause | Yes |
| ISC | Yes |
| GPL | No — copyleft, requires open-sourcing your code |
| AGPL | No |
| Commercial / custom | Requires legal review |

---

## Preferred Library List by Category

### Parsing and Document Processing

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| DOCX parsing | `mammoth` | ~150KB | Best DOCX → HTML/text conversion, well-maintained |
| Excel parsing/generation | `xlsx` (SheetJS) | ~300KB | Industry standard, handles all Excel variants |
| XML/HTML parsing | `fast-xml-parser` | ~50KB | Fast, minimal, better than `xml2js` |
| PDF text extraction | `pdf-parse` | ~200KB (server only) | Server-side only, never bundle to client |
| PDF generation (structured) | `@react-pdf/renderer` | ~350KB | React-based, excellent for document templates |
| PDF generation (programmatic) | `jsPDF` | ~200KB | Better for canvas-based / layout-flexible PDFs |
| Markdown parsing | `marked` or `unified` | ~40KB | `marked` is lighter; `unified` for full AST pipeline |
| CSV parsing | Native `FileReader` + split OR `Papa Parse` | `Papa Parse` ~45KB | Papa Parse handles edge cases (quotes, line endings) |

**Parsing note:** Parsing libraries are almost always server-side only. Do not bundle document parsers to the client.

```typescript
// ✅ DOCX parsing — server-side only
// pages/api/parse-document.ts OR app/api/parse-document/route.ts
import mammoth from 'mammoth'; // Only in server code

// ❌ Importing a parser in a client component
'use client';
import mammoth from 'mammoth'; // Ships 150KB to every user
```

### Search and Filtering

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| Client-side fuzzy search | `Fuse.js` | ~24KB | Best-in-class fuzzy matching, no server needed |
| Client-side full-text search | `minisearch` | ~28KB | Better for larger datasets than Fuse, inverted index |
| Client-side exact filtering | Native `.filter()` | 0 | For simple string matching, never need a library |
| Server-side full-text search | Postgres `tsvector` via Supabase | 0 client bundle | Built into Postgres — no extra library needed |
| Advanced search (large datasets) | Typesense (self-hosted) or Algolia | API only | When Postgres FTS is insufficient |

**The "elastic" reference:** If you were thinking about Elasticsearch — for app-scale search over your own data, Postgres full-text search via Supabase handles the overwhelming majority of use cases with zero extra infrastructure. Reserve Elasticsearch/Typesense for truly large-scale search requirements.

```typescript
// ✅ Client-side fuzzy search with Fuse.js
import Fuse from 'fuse.js';

const fuse = new Fuse(records, {
  keys: ['name', 'description', 'tags'],
  threshold: 0.3, // Lower = more strict matching
  includeScore: true,
});

const results = fuse.search(query).map(({ item }) => item);
```

### Forms and Validation

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| Form state management | `react-hook-form` | ~25KB | Minimal re-renders, best performance |
| Schema validation | `zod` | ~13KB | TypeScript-first, excellent DX, pairs perfectly with RHF |
| RHF + Zod integration | `@hookform/resolvers` | ~5KB | Official integration — always use this |

```typescript
// ✅ Standard form setup
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Date and Time

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| Date formatting / manipulation | `date-fns` | ~30KB (tree-shakeable) | Immutable, functional, fully tree-shakeable |
| Timezone-aware dates | `date-fns-tz` | ~5KB additional | Pairs with date-fns |
| Date pickers | `react-day-picker` | ~25KB | Pairs with date-fns, accessible, composable |

**Never use Moment.js.** It is 67KB gzipped, mutable, and deprecated. Its own authors recommend migrating away.

```typescript
// ✅ date-fns tree-shaking — only import what you use
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

// ❌ Moment.js — do not use
import moment from 'moment';
```

### UI and Interaction

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| Animation | `framer-motion` | ~50KB | Industry standard for React, GPU-accelerated |
| Accessible primitives | `@radix-ui/react-*` | ~5–15KB per primitive | Unstyled, fully accessible, composable |
| Icons | `lucide-react` | Tree-shakeable | Clean design, React-optimized, tree-shakeable |
| Class utilities | `clsx` + `tailwind-merge` via `cn()` | ~2KB | Standard pattern for conditional Tailwind classes |
| Drag and drop | `@dnd-kit/core` | ~25KB | Modern replacement for react-beautiful-dnd |

```typescript
// ✅ Standard cn() utility — create once, use everywhere
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Network and Data Fetching

| Task | Preferred Library | Bundle | Why |
|------|-----------------|--------|-----|
| Server-side data (Next.js RSC) | Native `fetch` in Server Components | 0 client bundle | Best for SSR/SSG — no library needed |
| Client-side data fetching + caching | `@tanstack/react-query` | ~40KB | Industry standard, handles caching/revalidation |
| Real-time subscriptions | Supabase Realtime | Via Supabase SDK | Built-in if already using Supabase |

### Email

| Task | Preferred Library | Why |
|------|-----------------|-----|
| Transactional email sending | `resend` | Already in use, simple API, React Email support |
| Email templating | `@react-email/components` | React-based email templates |

### File Handling

| Task | Preferred Library | Why |
|------|-----------------|-----|
| ZIP file creation | `adm-zip` (server) | Already in use |
| File type detection | `file-type` (server only) | Detects real file type from bytes, not extension |
| Image optimization | Next.js `<Image>` | Built-in — no separate library needed |

### Payments

| Task | Preferred Library | Why |
|------|-----------------|-----|
| Payment processing | Stripe + `@stripe/react-stripe-js` | Already in use, industry standard |

---

## Forbidden Libraries

Never add these. They are deprecated, insecure, excessively large, or have superior alternatives.

| Library | Reason | Alternative |
|---------|--------|-------------|
| `moment` | Deprecated by own authors, 67KB mutable | `date-fns` |
| `lodash` | Mostly replaced by native JS | Native array/object methods |
| `axios` | `fetch` is native and sufficient for most needs | Native `fetch` |
| `jquery` | No place in a React codebase | React |
| `request` | Deprecated, unmaintained | Native `fetch` |
| `react-beautiful-dnd` | Unmaintained | `@dnd-kit/core` |
| `enzyme` | Replaced by Testing Library | `@testing-library/react` |
| `moment-timezone` | Moment is deprecated | `date-fns-tz` |

---

## Adding a New Library: Required Process

Before opening a PR that adds a new dependency:

1. **Check if it can be built natively.** Under 50 lines? Build it.
2. **Run Bundlephobia check.** Document the gzipped bundle size in the PR.
3. **Check last commit date.** Unmaintained > 18 months? Find an alternative.
4. **Verify TypeScript support.** Must have first-party or high-quality types.
5. **Check license.** Must be MIT, Apache 2.0, BSD, or ISC.
6. **Check transitive dependencies.** Does it bring in 50 other packages?
7. **Is it dynamically imported?** If > 20KB and not on critical path, it must use `next/dynamic`.

```typescript
// Example PR comment when adding a library:
// Adding `fuse.js` for client-side fuzzy search
// - Bundle: 24KB gzipped (checked Bundlephobia)
// - License: Apache 2.0
// - Last commit: 3 months ago, active maintenance
// - TypeScript: first-party types
// - Dependencies: 0 transitive
// - Why not build: full fuzzy matching with scoring is 500+ lines
// - Loading: used in search hook, lazy loaded on first search interaction
```

---

## Library Checklist (Before Adding Any Dependency)

- [ ] Bundlephobia checked — gzipped size documented
- [ ] Last commit within 18 months (or confirmed stable/finished)
- [ ] License is MIT, Apache 2.0, BSD, or ISC
- [ ] TypeScript types available (first-party or quality `@types/`)
- [ ] Cannot be replaced by < 50 lines of native code
- [ ] If > 20KB: dynamically imported where appropriate
- [ ] No duplicates with existing dependencies (e.g., two date libraries)
- [ ] Added to the Preferred Library List above if it should become a standard

---

**Sources:** OpenSSF Best Practices Working Group "Concise Guide for Evaluating Open Source Software", nesbitt.io "How I Assess Open Source Libraries" (Dec 2025), Viget "Evaluating Open Source Third-Party Dependencies", Jordan Nielson "Evaluating JavaScript Open Source Packages", Andy Van Slaars "Making Informed Decisions on 3rd Party Libraries"
