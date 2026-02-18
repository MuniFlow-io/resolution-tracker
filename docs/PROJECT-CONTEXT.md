# Resolution Tracker — Project Context

**Vision:** A document generation and analysis hub for municipal finance workflows  
**Current Phase:** v1 — Resolution Cleaner only  
**Last Updated:** February 2026

---

## What This Is

Resolution Tracker is the hub. It is the home for document processing workflows that handle municipal bond deal documents — resolutions, term sheets, legal exhibits — with precision and without guessing.

The first tool in the hub is the **Resolution Cleaner**. It takes a Word document (a housing bond resolution), detects deal-specific variables with deterministic regex matching, groups them, shows the user every occurrence before anything is changed, and produces a clean updated `.docx`. No AI inference. No rewriting. No surprises.

---

## The Hub Architecture (Big Picture)

```
Resolution Tracker (Hub)
├── Resolution Cleaner v1 ✅  ← This sprint
├── [future] Bond Generator link → or migrate here later
└── [future] Additional document tools (TBD)
```

**What the hub is not:**
- A collaboration platform
- A deal management system
- A governance engine
- An AI assistant

The hub is a set of precision document tools. Each tool does one thing well and is trusted because of that precision.

---

## Why a Hub, Not Just One Tool

The document processing flow — parse, detect, tag, replace, export — is atomic and reusable. The Resolution Cleaner implements it for resolutions. The Bond Generator implements a version of it for certificate assembly. These patterns will repeat.

By building Resolution Tracker as a hub from day one:
- Shared UI components (upload zone, variable groups, preview panel, change log) are built once
- New tools are added to the hub, not as separate deployments
- The user builds mental familiarity with one interface, not five apps

The Bond Generator currently lives standalone. It may be brought into this hub in a future sprint. That decision is deferred — do not architect for it now.

---

## Resolution Cleaner v1 — What It Is

A surgical instrument. Given last year's housing bond resolution, it outputs a clean first draft for this year's deal. The user stays in control of every replacement.

**The flow in 6 steps:**
1. Upload the `.docx` resolution
2. See detected variables grouped by type (dates, dollar amounts, series, parties)
3. Preview every occurrence of each variable before changing anything
4. Enter a replacement value and confirm
5. Download the updated `.docx`
6. Review the change log

**What it never does:**
- Insert new language
- Rewrite or paraphrase
- Normalize or infer
- Apply changes without explicit confirmation
- Write to any database

**The trust statement** (microcopy that appears near every apply action):
> "We only replace the exact text you confirm. We don't rewrite any language."

---

## Resolution Cleaner v1 — What It Is Not

It is not a platform. Not Lighthouse. Not a term sheet writer. Not a deal awareness engine. Not collaborative. Not persistent.

It is the mechanical core. After it proves itself on real deals, features will be layered on top. Not before.

---

## After v1 Ships — Decision Points

These are not v1 features. They are the decisions that come *after* the engine proves itself:

1. **Save to Deal** — Map `confirmedTerms` to Supabase term sheet rows or role assignments
2. **Review Flags** — Mark certain variable types for a second review
3. **Deal Linking** — Associate a processed document with an existing deal record
4. **Lighthouse Mode** — Verification against authoritative source documents
5. **Bond Generator migration** — Bring the certificate generator into this hub
6. **Term Sheet prefill** — Use `confirmedTerms` to pre-populate a term sheet form

None of these are in v1. The architecture must not require them but must not block them.

---

## The Data Seam (How v1 Connects to the Future)

v1 produces one structured object at the end of every successful session:

```typescript
confirmedTerms = {
  borrower_name: "Balboa Lee Avenue, L.P.",
  lender_name: "Bank of America, N.A.",
  bond_counsel_name: "Kutak Rock LLP",
  series_name: "Series 2026-A",
  unit_count_total: 127,
  dated_date: "June 1, 2026"
}
```

This object is:
- Returned in the API response
- Held in client memory during the session
- Never persisted to Supabase in v1
- The hook that connects to every future feature listed above

The seam exists now so that when "Save to Deal" ships, no architectural refactoring is required. The data is already structured correctly.

---

## Naming and Terminology Clarification

The detection layer uses **document-defined role labels**:
- `(the "Borrower")` → term_key: `borrower_name`
- `(the "Funding Lender")` → term_key: `lender_name`
- `("Bond Counsel")` / `as bond counsel` → term_key: `bond_counsel_name`

These are document-layer terms — not the Supabase "roles" table. In Supabase, "Bond Counsel" is a Role entity linked to a Company entity. In the document layer, it is an anchored string label.

The mapping from `bond_counsel_name` (a string) → `Role: Bond Counsel → Company: Kutak Rock LLP` happens in a future sprint. Not now.

For v1, detected values are strings. Not objects. Not records.

---

## Engineering North Star for v1

> "Does this increase trust in deterministic replacement?"

If yes — proceed. If no — cut it.

The only thing that can kill this sprint is trying to make it smart. This sprint is about making it reliable.
