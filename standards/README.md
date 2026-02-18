# Resolution Tracker — Standards

These standards govern all development on the Resolution Tracker project and are designed to be shared, referenced, and enforced from day one. They extend and deepen the foundational `ELITE-STANDARDS.md` found in the BondGenerator project.

Every document here is backed by academic research, industry authority, or large-scale empirical testing — not opinion.

---

## Standards Index

| Document | What It Governs | Key Authority |
|----------|----------------|---------------|
| [RESPONSIVE-DESIGN-STANDARDS.md](./RESPONSIVE-DESIGN-STANDARDS.md) | Mobile-first, breakpoints, adaptive components, touch targets | W3C WCAG 2.2, MDN, Google web.dev |
| [LOADING-STRATEGY-STANDARDS.md](./LOADING-STRATEGY-STANDARDS.md) | Critical path loading, lazy vs eager, Core Web Vitals, skeletons | Google web.dev, HTTP Archive 2025 |
| [ERROR-UX-STANDARDS.md](./ERROR-UX-STANDARDS.md) | Error display patterns, message copy, accessibility | Nielsen Norman Group, WCAG 2.2 |
| [VALIDATION-STANDARDS.md](./VALIDATION-STANDARDS.md) | When to validate, progressive validation, Zod patterns, edge cases | Baymard Institute, Smashing Magazine, a11yblog |
| [LAYOUT-SPACE-STANDARDS.md](./LAYOUT-SPACE-STANDARDS.md) | 8-point grid, containers, whitespace, density levels | Atlassian Design, Microsoft WAF, WCAG 2.2 |
| [OPEN-SOURCE-STRATEGY.md](./OPEN-SOURCE-STRATEGY.md) | Library selection, evaluation criteria, preferred library list | OpenSSF, npm ecosystem research 2025 |
| [COLOR-AND-VISUAL-RESTRAINT-STANDARDS.md](./COLOR-AND-VISUAL-RESTRAINT-STANDARDS.md) | Color budget, restraint rules, contrast, state colors | WCAG 2.2, ACM eye-tracking research 2025 |

---

## The Philosophy Behind These Standards

The existing `ELITE-STANDARDS.md` covers code quality: layer architecture, TypeScript strictness, logging, and service patterns. These documents cover the other half: **what users see, feel, and experience**.

The most architecturally perfect code in the world does not matter if:
- The page is broken on a phone
- The LCP is 4 seconds because the hero image is lazy-loaded
- The error message says "Error 422"
- The form yells at users before they finish typing
- The page is so visually loud that nothing guides the eye
- A 300KB library was added to solve a 10-line problem

These standards are the answer to all of those.

---

## How to Use These Standards

**When starting a new feature:**
1. Check `RESPONSIVE-DESIGN-STANDARDS.md` — mobile-first component structure
2. Check `LAYOUT-SPACE-STANDARDS.md` — correct max-width, grid, and spacing
3. Check `COLOR-AND-VISUAL-RESTRAINT-STANDARDS.md` — color budget for the page

**When building forms:**
1. Check `VALIDATION-STANDARDS.md` — progressive validation, edge cases
2. Check `ERROR-UX-STANDARDS.md` — inline error display, message copy

**When building async data features:**
1. Check `LOADING-STRATEGY-STANDARDS.md` — skeleton vs spinner, lazy vs eager
2. Check `ERROR-UX-STANDARDS.md` — section error banners, retry patterns

**When adding a new library:**
1. Check `OPEN-SOURCE-STRATEGY.md` — evaluate before installing

**Before every PR:**
- Run through the checklist at the bottom of each relevant document

---

## Relationship to ELITE-STANDARDS.md

These standards are additive. `ELITE-STANDARDS.md` governs:
- Code layer architecture (Component → Hook → API → Service)
- TypeScript strictness
- File size limits
- Logging

These standards govern:
- Visual and UX quality
- Performance (user-perceived)
- Accessibility
- Dependency management

Both sets of standards are non-negotiable.
