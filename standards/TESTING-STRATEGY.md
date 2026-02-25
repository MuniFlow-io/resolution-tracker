# Testing Strategy Standard

**Authority:** Test pyramid reliability guidance, regression prevention practice, and internal Resolution Cleaner risk profile  
**Philosophy:** Fail fast in tests, not in production.  
**Last Updated:** February 2026

---

## Layered Strategy (MANDATORY)

### Layer 1: Unit Tests

Required for detection and replacement primitives:

- regex acceptance tests per drafting variant
- hard-filter rejection tests (`WHEREAS`, `RESOLVED`, `Section`, newline, comma threshold, max length)
- currency literal preservation tests

### Layer 2: Golden Tests

Use fixed fixtures for normalized outputs:

- frozen detection fixture snapshot
- replacement output hash checks when fixture docs are available

### Layer 3: Replay Determinism

Run the same input repeatedly (`N=100` minimum) and verify:

- output payload hash is identical every run
- group IDs are identical every run

### Layer 4: Fuzz-Lite Stress Tests

Use randomized punctuation/newline/quote wrappers around anchors and assert:

- no unsafe captures
- no crashes in detection/replacement path

---

## Red-First Rule

When implementing new behavior, tests should intentionally fail first to prove they catch the missing behavior.  
Implementation is complete only when all relevant failing tests turn green.

---

## Required Commands

Before PR merge:

- `npm run typecheck`
- `npm test`

No PR is complete while determinism or currency trust tests are red.

---

## Fixture Management Rules

- Keep fixtures minimal and representative
- Version fixture updates in the same PR as behavior changes
- Never update golden files without a clear rationale in PR description
