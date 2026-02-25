# CI Quality Gates Standard

**Authority:** Modern CI reliability practice and internal release-risk controls  
**Philosophy:** Ship only what is reproducible and trustworthy.  
**Last Updated:** February 2026

---

## Scope

This document defines required quality gates for Resolution Cleaner.  
In this phase, these gates are documented policy; CI pipeline wiring is implemented in a later phase.

---

## Required Gates

Any build touching Resolution Cleaner must fail if:

- TypeScript typecheck fails
- Determinism replay test fails
- Hard-filter regression tests fail
- Currency trust tests fail

Required commands:

- `npm run typecheck`
- `npm test`

---

## Static Guard Policy

In replacement-path modules, numeric coercion of replacement literals is prohibited:

- `Number(...)`
- `parseInt(...)`
- `parseFloat(...)`

Target modules:

- `pages/api/resolution-cleaner/replace.ts`
- `modules/resolution-cleaner/components/ReplaceForm.tsx`
- `lib/services/resolution-cleaner/*` replacement path files

Enforcement recommendation for CI implementation phase:

- add ESLint restricted-syntax/no-restricted-globals rule scoped to replacement modules
- keep currency trust tests as executable backup guard

---

## Definition Of Done (Resolution Cleaner Changes)

- Tests added or updated for changed behavior
- Determinism evidence captured via replay/golden tests
- Standards docs kept current with implementation behavior
