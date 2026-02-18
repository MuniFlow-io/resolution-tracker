# Resolution Cleaner v1 — Technical Architecture

**Sprint Duration:** 10 Days  
**Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS  
**Scope:** Document processing only — no Supabase writes  
**Engineering Priority:** Parsing accuracy and replacement determinism above all else  
**Last Updated:** February 2026

---

## Engineering Priority Order (From Sprint Spec)

1. Accurate `.docx` parsing with character offset tracking
2. Safe `.docx` reassembly from modified XML
3. Exact variable grouping logic
4. Deterministic replacement engine
5. Preview navigation
6. Change log
7. UI polish

Do not work on #7 while #1 is incomplete. Do not optimize #6 until #4 is proven correct.

---

## Project Folder Structure

```
Resolution-Tracker/
├── app/
│   ├── layout.tsx                       ← Root layout (dark theme, fonts)
│   ├── page.tsx                         ← Hub landing page
│   └── resolution-cleaner/
│       └── page.tsx                     ← Resolution Cleaner tool page
├── components/
│   ├── ui/                              ← Shared atomic UI
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Input.tsx
│   │   └── Spinner.tsx
│   └── hub/
│       └── ToolCard.tsx                 ← Hub landing tool cards
├── modules/
│   └── resolution-cleaner/
│       ├── types/
│       │   └── resolutionData.ts        ← ALL types for this module
│       ├── hooks/
│       │   ├── useDocumentUpload.ts     ← File selection, upload to API
│       │   ├── useVariableGroups.ts     ← State for detected groups, group actions
│       │   └── useReplacement.ts        ← Replacement logic, change log, download
│       ├── components/
│       │   ├── UploadZone.tsx           ← Drag-and-drop upload
│       │   ├── VariableGroupList.tsx    ← Full list of detected groups
│       │   ├── VariableGroupRow.tsx     ← Single group row (text, count, actions)
│       │   ├── PreviewPanel.tsx         ← Occurrence viewer with Prev/Next
│       │   ├── ReplaceForm.tsx          ← "Replace with" input + confirm
│       │   └── ChangeLog.tsx            ← Post-replacement summary
│       └── api/
│           └── resolutionApi.ts         ← HTTP wrappers (frontend API layer)
├── lib/
│   └── services/
│       └── resolution-cleaner/
│           ├── parseDocx.ts             ← Unzip .docx, extract XML, rebuild text with offsets
│           ├── detectVariables.ts       ← Run regex patterns, group results
│           ├── regexPatterns.ts         ← All regex definitions in one place
│           ├── replacementEngine.ts     ← Apply confirmed replacements to XML
│           └── assembleDocx.ts          ← Re-zip modified .docx, return buffer
└── pages/
    └── api/
        └── resolution-cleaner/
            ├── parse.ts                 ← POST: upload .docx → variable groups
            └── replace.ts              ← POST: confirmed replacements → .docx buffer + change log
```

---

## TypeScript Types (Complete)

File: `modules/resolution-cleaner/types/resolutionData.ts`

```typescript
// ─── Variable Detection ───────────────────────────────────────────────────────

export type VariableType =
  | 'date'
  | 'currency'
  | 'series'
  | 'borrower'
  | 'funding_lender'
  | 'bond_counsel'
  | 'unit_count'
  | 'issuer';

export type TermKey =
  | 'borrower_name'
  | 'lender_name'
  | 'bond_counsel_name'
  | 'series_name'
  | 'unit_count_total'
  | 'dated_date'
  | null; // dates and currency may have null term_key in v1

export interface OccurrenceOffset {
  index: number;             // position within occurrences[] — used for confirm/exclude tracking
  match_text: string;        // exact text as found in document
  start_offset: number;      // character offset in the full reconstructed document text
  end_offset: number;        // character offset (exclusive)
  context_before: string;    // ~60 chars before match — shown in preview
  context_after: string;     // ~60 chars after match — shown in preview
}

export interface VariableGroup {
  group_id: string;                // uuid
  type: VariableType;
  detected_value_raw: string;      // exact string as it appears in the document
  occurrences: OccurrenceOffset[];
  occurrence_count: number;
  term_key: TermKey;
  is_locked: boolean;              // true for issuer — display only, cannot be replaced
}

// ─── User Confirmation State (client-only) ────────────────────────────────────

export type OccurrenceStatus = 'pending' | 'confirmed' | 'excluded';

export interface OccurrenceState {
  index: number;
  status: OccurrenceStatus;
}

export type GroupAction = 'idle' | 'previewing' | 'replacing' | 'done' | 'ignored';

export interface VariableGroupState extends VariableGroup {
  action: GroupAction;
  occurrenceStates: OccurrenceState[];
  replacement_value: string | null;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface ParseRequest {
  // FormData — file: File (.docx)
}

export interface ParseResult {
  fileName: string;
  variableGroups: VariableGroup[];
  rawFileBase64: string; // base64 of original .docx — kept in client state for replace call
}

export interface ConfirmedReplacement {
  group_id: string;
  original_value: string;
  new_value: string;
  confirmed_occurrence_offsets: Array<{ start: number; end: number }>;
  term_key: TermKey;
}

export interface ReplaceRequest {
  rawFileBase64: string;
  confirmedReplacements: ConfirmedReplacement[];
}

export interface ChangeLogEntry {
  original_value: string;
  new_value: string;
  replacement_count: number;
  term_key: TermKey;
  timestamp: string; // ISO string
}

export interface ConfirmedTerms {
  borrower_name?: string;
  lender_name?: string;
  bond_counsel_name?: string;
  series_name?: string;
  unit_count_total?: number;
  dated_date?: string;
}

export interface ReplaceResult {
  updatedFileBase64: string;   // base64 encoded .docx for download
  changeLog: ChangeLogEntry[];
  confirmedTerms: ConfirmedTerms;
}

// ─── Page-Level State Machine ─────────────────────────────────────────────────

export type AppStep =
  | 'upload'       // Waiting for file
  | 'parsing'      // File uploaded, API processing
  | 'review'       // Detected groups shown, user reviewing
  | 'replacing'    // API applying replacements
  | 'complete';    // Change log + download available

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Regex Patterns

File: `lib/services/resolution-cleaner/regexPatterns.ts`

```typescript
// ─── Date Patterns ────────────────────────────────────────────────────────────

// Long month format: "September 1, 2024"
export const LONG_DATE_REGEX =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi;

// Numeric date format: "09/01/2024" or "9/1/2024"
export const NUMERIC_DATE_REGEX = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;

// ─── Currency Patterns ────────────────────────────────────────────────────────

// Strict: comma-grouped amounts only — $84,116,000 / $1,000
// Does not match $1000 (no commas) — intentional, high precision
export const CURRENCY_REGEX = /\$\d{1,3}(?:,\d{3})+(?!\d)/g;

// ─── Series Patterns ─────────────────────────────────────────────────────────

// Hyphenated: Series 2024-A
export const SERIES_HYPHEN_REGEX = /\bSeries\s+\d{4}-[A-Z]{1,3}\b/gi;

// Non-hyphenated: Series 2026C
export const SERIES_NOHYPHEN_REGEX = /\bSeries\s+\d{4}[A-Z]{1,3}\b/gi;

// ─── Anchored Role Patterns ───────────────────────────────────────────────────

// Borrower: entity immediately before (the "Borrower")
// Capture group 1: the entity name preceding the anchor
export const BORROWER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,80}?)\s*\(\s*the\s+"Borrower"\s*\)/g;

// Funding Lender: entity immediately before (the "Funding Lender")
export const FUNDING_LENDER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,80}?)\s*\(\s*the\s+"Funding Lender"\s*\)/g;

// Bond Counsel: entity immediately before ("Bond Counsel") or "as bond counsel"
export const BOND_COUNSEL_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,80}?)\s*(?:\(\s*"Bond Counsel"\s*\)|as\s+bond\s+counsel)/gi;

// ─── Unit Count Pattern ───────────────────────────────────────────────────────

// Pattern: 127-unit
export const UNIT_COUNT_REGEX = /\b(\d+)-unit\b/gi;

// ─── Issuer (Locked) Patterns ─────────────────────────────────────────────────

// Display only — the issuer entity, cannot be replaced
export const ISSUER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,80}?)\s*\(\s*the\s+"(?:City|Issuer)"\s*\)/g;

// ─── Pattern Registry ─────────────────────────────────────────────────────────

// Used by detectVariables.ts to iterate all patterns
export const PATTERN_REGISTRY = [
  { type: 'date' as const,           regex: LONG_DATE_REGEX,              term_key: null,                    is_locked: false },
  { type: 'date' as const,           regex: NUMERIC_DATE_REGEX,           term_key: null,                    is_locked: false },
  { type: 'currency' as const,       regex: CURRENCY_REGEX,               term_key: null,                    is_locked: false },
  { type: 'series' as const,         regex: SERIES_HYPHEN_REGEX,          term_key: 'series_name' as const,  is_locked: false },
  { type: 'series' as const,         regex: SERIES_NOHYPHEN_REGEX,        term_key: 'series_name' as const,  is_locked: false },
  { type: 'borrower' as const,       regex: BORROWER_ANCHOR_REGEX,        term_key: 'borrower_name' as const,is_locked: false },
  { type: 'funding_lender' as const, regex: FUNDING_LENDER_ANCHOR_REGEX,  term_key: 'lender_name' as const,  is_locked: false },
  { type: 'bond_counsel' as const,   regex: BOND_COUNSEL_ANCHOR_REGEX,    term_key: 'bond_counsel_name' as const, is_locked: false },
  { type: 'unit_count' as const,     regex: UNIT_COUNT_REGEX,             term_key: 'unit_count_total' as const, is_locked: false },
  { type: 'issuer' as const,         regex: ISSUER_ANCHOR_REGEX,          term_key: null,                    is_locked: true },
] as const;
```

---

## Service Layer

### `parseDocx.ts` — The Critical Path (Priority #1 and #2)

The hardest part. A `.docx` is a ZIP containing `word/document.xml`. Text in XML is split across `<w:r>` (run) elements which can break a single word mid-character due to formatting changes. The offset tracking must reconstruct a flat text string while maintaining a map back to XML node positions for surgical replacement.

```typescript
// lib/services/resolution-cleaner/parseDocx.ts

import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

export interface RunMap {
  text: string;
  flatStart: number; // character offset in the reconstructed flat string
  flatEnd: number;
  // XML path information for targeted replacement
  paragraphIndex: number;
  runIndex: number;
}

export interface ParsedDocument {
  flatText: string;   // The full document text, stitched together
  runMap: RunMap[];   // Maps character offsets back to XML run positions
  xmlString: string;  // Original XML — preserved for reassembly
  rawZip: AdmZip;     // Original ZIP — preserved for non-document files
}

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const zip = new AdmZip(buffer);
  const xmlEntry = zip.getEntry('word/document.xml');
  if (!xmlEntry) throw new Error('Invalid .docx file — word/document.xml not found');

  const xmlString = xmlEntry.getData().toString('utf8');
  
  // Parse XML and walk w:r (run) elements to build flat text + run map
  // This is the hard part — see implementation notes below
  const { flatText, runMap } = extractRunsFromXml(xmlString);

  return { flatText, runMap, xmlString, rawZip: zip };
}
```

**Implementation note for `extractRunsFromXml`:**
Walk `w:body → w:p → w:r → w:t` elements. For each `w:t` node:
- Capture the text content
- Record the character offset in the flat string (cumulative)
- Record the paragraph index and run index

Some runs have `xml:space="preserve"` — preserve leading/trailing spaces.

### `detectVariables.ts`

```typescript
// lib/services/resolution-cleaner/detectVariables.ts

import { v4 as uuidv4 } from 'uuid';
import { PATTERN_REGISTRY } from './regexPatterns';
import { VariableGroup, OccurrenceOffset } from '@/modules/resolution-cleaner/types/resolutionData';

export function detectVariables(flatText: string): VariableGroup[] {
  // Map from detected_value_raw → VariableGroup (for grouping exact matches)
  const groups = new Map<string, VariableGroup>();

  for (const { type, regex, term_key, is_locked } of PATTERN_REGISTRY) {
    // Reset lastIndex before each pass (important for stateful regexes)
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(flatText)) !== null) {
      // For anchored patterns (borrower, lender, bond_counsel, issuer),
      // capture group 1 is the entity name; match[0] is the full match
      const detected_value_raw = match[1]?.trim() ?? match[0].trim();
      const match_text = match[0];

      const start_offset = match.index + (match[0].indexOf(detected_value_raw));
      const end_offset = start_offset + detected_value_raw.length;

      const context_before = flatText.slice(Math.max(0, match.index - 60), match.index);
      const context_after = flatText.slice(match.index + match_text.length, match.index + match_text.length + 60);

      const existing = groups.get(detected_value_raw);

      const occurrence: OccurrenceOffset = {
        index: existing ? existing.occurrences.length : 0,
        match_text: detected_value_raw,
        start_offset,
        end_offset,
        context_before,
        context_after,
      };

      if (existing) {
        existing.occurrences.push(occurrence);
        existing.occurrence_count++;
      } else {
        groups.set(detected_value_raw, {
          group_id: uuidv4(),
          type,
          detected_value_raw,
          occurrences: [occurrence],
          occurrence_count: 1,
          term_key,
          is_locked,
        });
      }
    }
  }

  return Array.from(groups.values());
}
```

### `replacementEngine.ts` — Priority #4 (Never Sacrifice Determinism)

```typescript
// lib/services/resolution-cleaner/replacementEngine.ts

import { ConfirmedReplacement } from '@/modules/resolution-cleaner/types/resolutionData';

export interface ReplacementResult {
  modifiedXmlString: string;
  actualReplacementCounts: Record<string, number>; // group_id → actual count made
}

export function applyReplacements(
  xmlString: string,
  flatText: string,
  confirmedReplacements: ConfirmedReplacement[]
): ReplacementResult {
  // Safety check: verify that every confirmed offset still matches the expected original_value
  // If ANY mismatch → abort the entire operation (do not partial-apply)
  for (const replacement of confirmedReplacements) {
    for (const { start, end } of replacement.confirmed_occurrence_offsets) {
      const actual = flatText.slice(start, end);
      if (actual !== replacement.original_value) {
        throw new Error(
          `Replacement integrity check failed for "${replacement.original_value}". ` +
          `Found "${actual}" at offset ${start}. Aborting all replacements.`
        );
      }
    }
  }

  // Apply replacements in reverse offset order to preserve upstream offsets
  // Sort all confirmed occurrences by start_offset descending
  const allOccurrences = confirmedReplacements.flatMap(r =>
    r.confirmed_occurrence_offsets.map(o => ({
      ...o,
      group_id: r.group_id,
      original_value: r.original_value,
      new_value: r.new_value,
    }))
  ).sort((a, b) => b.start - a.start);

  // Apply XML-level replacements
  // Implementation: locate each offset in the runMap, replace text within w:t nodes
  // This is the surgical step — replace only the exact text content of the run(s)
  // that span the target offset range
  
  const actualCounts: Record<string, number> = {};
  // ... XML manipulation logic here ...
  
  return { modifiedXmlString: xmlString, actualReplacementCounts: actualCounts };
}
```

### `assembleDocx.ts`

```typescript
// lib/services/resolution-cleaner/assembleDocx.ts

import AdmZip from 'adm-zip';

export function assembleDocx(rawZip: AdmZip, modifiedXmlString: string): Buffer {
  // Replace only word/document.xml — all other files (styles, relationships, images) preserved
  rawZip.updateFile('word/document.xml', Buffer.from(modifiedXmlString, 'utf8'));
  return rawZip.toBuffer();
}
```

---

## API Layer

### `pages/api/resolution-cleaner/parse.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { parseDocx } from '@/lib/services/resolution-cleaner/parseDocx';
import { detectVariables } from '@/lib/services/resolution-cleaner/detectVariables';
import { withRequestId } from '@/lib/middleware/withRequestId';
import { logger } from '@/lib/logger';
import type { ServiceResult, ParseResult } from '@/modules/resolution-cleaner/types/resolutionData';

export const config = { api: { bodyParser: false } };

async function handler(req: NextApiRequest, res: NextApiResponse<ServiceResult<ParseResult>>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB limit
    const [, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!file.originalFilename?.endsWith('.docx')) {
      return res.status(400).json({ success: false, error: 'Only .docx files are supported' });
    }

    const buffer = fs.readFileSync(file.filepath);
    const parsed = await parseDocx(buffer);
    const variableGroups = detectVariables(parsed.flatText);

    logger.info('Resolution parsed successfully', {
      fileName: file.originalFilename,
      groupCount: variableGroups.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        fileName: file.originalFilename,
        variableGroups,
        rawFileBase64: buffer.toString('base64'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Parse failed';
    logger.error('Resolution parse failed', { error: message });
    return res.status(500).json({ success: false, error: message });
  }
}

export default withRequestId(handler);
```

### `pages/api/resolution-cleaner/replace.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { parseDocx } from '@/lib/services/resolution-cleaner/parseDocx';
import { applyReplacements } from '@/lib/services/resolution-cleaner/replacementEngine';
import { assembleDocx } from '@/lib/services/resolution-cleaner/assembleDocx';
import { withRequestId } from '@/lib/middleware/withRequestId';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import type { ServiceResult, ReplaceResult, ChangeLogEntry, ConfirmedTerms } from '@/modules/resolution-cleaner/types/resolutionData';

const replaceSchema = z.object({
  rawFileBase64: z.string().min(1),
  confirmedReplacements: z.array(z.object({
    group_id: z.string().uuid(),
    original_value: z.string().min(1),
    new_value: z.string().min(1),
    confirmed_occurrence_offsets: z.array(z.object({
      start: z.number().int().min(0),
      end: z.number().int().min(0),
    })).min(1),
    term_key: z.string().nullable(),
  })).min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse<ServiceResult<ReplaceResult>>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const validation = replaceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid request', details: validation.error.flatten() } as never);
  }

  const { rawFileBase64, confirmedReplacements } = validation.data;

  try {
    const buffer = Buffer.from(rawFileBase64, 'base64');
    const parsed = await parseDocx(buffer);

    const { modifiedXmlString, actualReplacementCounts } = applyReplacements(
      parsed.xmlString,
      parsed.flatText,
      confirmedReplacements
    );

    const updatedBuffer = assembleDocx(parsed.rawZip, modifiedXmlString);
    const timestamp = new Date().toISOString();

    const changeLog: ChangeLogEntry[] = confirmedReplacements.map(r => ({
      original_value: r.original_value,
      new_value: r.new_value,
      replacement_count: actualReplacementCounts[r.group_id] ?? 0,
      term_key: r.term_key as never,
      timestamp,
    }));

    // Build confirmedTerms for future integration seam
    const confirmedTerms: ConfirmedTerms = {};
    for (const r of confirmedReplacements) {
      if (r.term_key === 'borrower_name')      confirmedTerms.borrower_name = r.new_value;
      if (r.term_key === 'lender_name')        confirmedTerms.lender_name = r.new_value;
      if (r.term_key === 'bond_counsel_name')  confirmedTerms.bond_counsel_name = r.new_value;
      if (r.term_key === 'series_name')        confirmedTerms.series_name = r.new_value;
      if (r.term_key === 'unit_count_total')   confirmedTerms.unit_count_total = parseInt(r.new_value);
      if (r.term_key === 'dated_date')         confirmedTerms.dated_date = r.new_value;
    }

    logger.info('Replacements applied successfully', {
      replacementCount: confirmedReplacements.length,
      totalOccurrences: Object.values(actualReplacementCounts).reduce((a, b) => a + b, 0),
    });

    return res.status(200).json({
      success: true,
      data: {
        updatedFileBase64: updatedBuffer.toString('base64'),
        changeLog,
        confirmedTerms,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Replacement failed';
    logger.error('Replacement failed', { error: message });
    
    // If replacement engine aborted (mismatch), return 409 Conflict
    const statusCode = message.includes('integrity check failed') ? 409 : 500;
    return res.status(statusCode).json({ success: false, error: message });
  }
}

export default withRequestId(handler);
```

---

## Hook Layer

### `useDocumentUpload.ts`

```typescript
// Manages: step = 'upload' → 'parsing' → 'review'
// State: file, parseResult, step, status, error
// Actions: handleFileSelect, handleUpload
```

### `useVariableGroups.ts`

```typescript
// Manages: variableGroupStates[] (action, occurrenceStates, replacement_value per group)
// Actions: setGroupAction, setOccurrenceStatus, setReplacementValue
// Derived: confirmedGroups (groups where action === 'done')
```

### `useReplacement.ts`

```typescript
// Manages: step = 'replacing' → 'complete'
// State: changeLog, confirmedTerms, downloadUrl, status, error
// Actions: handleApplyAll, handleDownload
// Note: builds ConfirmedReplacement[] from confirmedGroups and sends to /api/replace
```

---

## Drift Guardrails (Engineering Rules — Non-Negotiable)

These are taken directly from the sprint spec. If any of these conditions appear in a PR, it is drift and must be rejected.

| Red Flag | Correct Behavior |
|----------|-----------------|
| "Let's try to detect which dollar amount is the NTE" | Detect all. No interpretation. |
| "Let's infer which date is the closing date" | Group by exact string. No inference. |
| "Let's normalize currency formats" | Group exact text. No transformation. |
| "Let's update the term sheet automatically" | No database writes in v1. |
| "Let's sync roles" | No Supabase in v1. |
| "Let's also replace similar strings" | Replace only confirmed exact spans. |
| "Let's auto-adjust formatting" | Preserve formatting exactly. |
| Multiple tabs / sidebar / filtering / tooltips | Minimal UI only. |
| New detection category not in the list | No additions to detection scope in v1. |

---

## Dependencies to Add

All consistent with `OPEN-SOURCE-STRATEGY.md` standards:

| Package | Purpose | Bundle Impact |
|---------|---------|---------------|
| `adm-zip` | `.docx` unzip/re-zip | Server only |
| `fast-xml-parser` | `.docx` XML parsing | Server only |
| `formidable` | Multipart file upload parsing | Server only |
| `uuid` | Group ID generation | ~8KB, tree-shakeable |
| `zod` | API input validation | Already included |

No new client-side bundles beyond what the standard stack uses. All document processing happens server-side.

---

## Acceptance Test — Definition of Done

A real housing bond resolution (`.docx`) is processed end-to-end:

- [ ] Borrower detected only when preceded by `(the "Borrower")` anchor
- [ ] Funding Lender detected only when anchored
- [ ] Bond Counsel detected only when anchored
- [ ] Issuer shown as locked — no replace UI shown
- [ ] All distinct currency strings produce separate variable groups
- [ ] Dates grouped by exact string match (no normalization)
- [ ] Series grouped by exact string match
- [ ] Unit count detected via `\d+-unit` pattern
- [ ] Replacing a value updates exactly the confirmed occurrence count
- [ ] No unintended text changes in the output `.docx`
- [ ] No inserted language
- [ ] Formatting preserved (bold, italic, indentation)
- [ ] Abort occurs safely if character offset mismatch detected
- [ ] Clean `.docx` downloads successfully
- [ ] Change log reflects accurate occurrence counts
- [ ] `confirmedTerms` object generated correctly in API response
- [ ] You personally trust it on a live deal. If you hesitate — it is not done.
