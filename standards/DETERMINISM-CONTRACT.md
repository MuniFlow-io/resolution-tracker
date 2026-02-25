# Determinism Contract Standard

**Authority:** Distributed systems reproducibility practices, software testing reliability research, and internal Resolution Cleaner production requirements  
**Philosophy:** Same bytes in means same bytes out.  
**Last Updated:** February 2026

---

## Non-Negotiable Contract

For Resolution Cleaner, this tuple defines a deterministic run:

1. Same `.docx` bytes input
2. Same detection rules version
3. Same confirmed replacements in the same order

It must produce identical:

- detected groups
- occurrence offsets
- replacement counts
- output document bytes

If any of those differ, the behavior is a bug.

---

## Required Pipeline Shape

Core processing must remain stage-pure and contract-driven:

- `parseDocx(buffer) -> ParsedDocument`
- `detectCandidates(flatText) -> DetectedCandidate[]`
- `applyHardFilters(candidates) -> ValidatedCapture[]`
- `groupDetections(validated) -> VariableGroup[]`
- `applyReplacements(parsedDoc, replacements) -> modifiedXml`

Prohibited inside core stages:

- random ID generation
- hidden mutation of shared state
- timing-based behavior
- non-deterministic iteration/order assumptions

---

## Stable Ordering Rules

Grouped detections must be sorted by:

1. variable type order
2. first occurrence start offset
3. raw literal value (binary compare)

Replacements must be applied in deterministic reverse XML-offset order.

Group IDs must be deterministic (derived from `type + raw + firstOffset`) and never UUID-random.

---

## Determinism Verification

Every change touching Resolution Cleaner must keep these tests green:

- replay determinism test (same payload 100 runs)
- golden fixture snapshot test for normalized detection output
- replacement integrity checks

---

## Checklist Before Merge

- [ ] No random or time-based behavior in service pipeline
- [ ] Deterministic replay test passes
- [ ] Golden fixture updated only when behavior change is intentional
- [ ] Group ID generation is deterministic and stable
