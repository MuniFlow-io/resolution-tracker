import { createHash } from "node:crypto";
import { PATTERN_REGISTRY } from "@/lib/services/resolution-cleaner/regexPatterns";
import type {
  DetectedCandidate,
  OccurrenceOffset,
  ValidatedCapture,
  VariableType,
  VariableGroup,
} from "@/modules/resolution-cleaner/types/resolutionData";

function stripXmlFragments(s: string): string {
  // Remove XML/HTML-like tags that can appear in flatText when a docx <w:t> node
  // contains entity-encoded angle brackets (e.g. &lt;wtrPr&gt;). These are artifacts
  // of the document XML structure and are meaningless to the user.
  return s
    .replace(/<[^>]{0,300}>/g, " ")
    // Handle truncated fragments where context slicing cuts before the closing ">".
    .replace(/<[^>\n]{0,300}$/g, " ")
    .replace(/\s{2,}/g, " ");
}

function buildContext(text: string, start: number, end: number) {
  const before = text.slice(Math.max(0, start - 60), start);
  const after = text.slice(end, Math.min(text.length, end + 60));
  return {
    context_before: stripXmlFragments(before),
    context_after: stripXmlFragments(after),
  };
}

const TYPE_ORDER: Record<VariableType, number> = {
  date: 0,
  currency: 1,
  series: 2,
  borrower: 3,
  funding_lender: 4,
  project_name: 5,
  property_address: 6,
  bond_counsel: 7,
  unit_count: 8,
  issuer: 9,
};

function isSafeCapture(raw: string): boolean {
  if (!raw) return false;
  if (raw.length > 200) return false;
  if (/[\r\n]/.test(raw)) return false;
  if (/(?:\bWHEREAS\b|\bRESOLVED\b|\bSection\b)/i.test(raw)) return false;
  const commaCount = (raw.match(/,/g) ?? []).length;
  if (commaCount > 2) return false;
  return true;
}

function compareBinary(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function buildDeterministicGroupId(type: VariableType, raw: string, firstOffset: number): string {
  const input = `${type}|${raw}|${firstOffset}`;
  const digest = createHash("sha256").update(input).digest("hex");
  return `grp_${digest.slice(0, 20)}`;
}

function detectCandidates(flatText: string): DetectedCandidate[] {
  const candidates: DetectedCandidate[] = [];
  for (const { type, regex, term_key, is_locked } of PATTERN_REGISTRY) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = regex.exec(flatText)) !== null) {
      const raw = match[1]?.trim() ?? match[0].trim();
      const baseIndex = match.index;
      const offsetWithinMatch = match[0].indexOf(raw);
      const start_offset = baseIndex + (offsetWithinMatch >= 0 ? offsetWithinMatch : 0);
      const end_offset = start_offset + raw.length;
      candidates.push({
        type,
        raw_value: raw,
        match_text: raw,
        start_offset,
        end_offset,
        term_key,
        is_locked,
      });
    }
  }
  return candidates;
}

function validateCandidates(flatText: string, candidates: DetectedCandidate[]): ValidatedCapture[] {
  return candidates
    .filter((candidate) => {
      if (!candidate.raw_value) return false;
      if (candidate.start_offset < 0 || candidate.end_offset <= candidate.start_offset) return false;
      if (candidate.end_offset > flatText.length) return false;
      if (!isSafeCapture(candidate.raw_value)) return false;
      return true;
    })
    .map((candidate) => ({
      ...candidate,
      context_before: buildContext(flatText, candidate.start_offset, candidate.end_offset).context_before,
      context_after: buildContext(flatText, candidate.start_offset, candidate.end_offset).context_after,
    }));
}

function groupValidated(validated: ValidatedCapture[]): VariableGroup[] {
  const map = new Map<string, VariableGroup>();
  for (const capture of validated) {
    const key = `${capture.type}:${capture.raw_value}`;
    const occurrenceBase: Omit<OccurrenceOffset, "index"> = {
      match_text: capture.match_text,
      start_offset: capture.start_offset,
      end_offset: capture.end_offset,
      context_before: capture.context_before,
      context_after: capture.context_after,
    };

    const existing = map.get(key);
    if (existing) {
      const index = existing.occurrences.length;
      existing.occurrences.push({ ...occurrenceBase, index });
      existing.occurrence_count += 1;
    } else {
      const firstOffset = occurrenceBase.start_offset;
      map.set(key, {
        group_id: buildDeterministicGroupId(capture.type, capture.raw_value, firstOffset),
        type: capture.type,
        detected_value_raw: capture.raw_value,
        occurrences: [{ ...occurrenceBase, index: 0 }],
        occurrence_count: 1,
        term_key: capture.term_key,
        is_locked: capture.is_locked,
      });
    }
  }

  return Array.from(map.values());
}

export function detectVariables(flatText: string): VariableGroup[] {
  const candidates = detectCandidates(flatText);
  const validated = validateCandidates(flatText, candidates);
  const grouped = groupValidated(validated);
  return grouped.sort(
    (a, b) =>
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      (a.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) -
        (b.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) ||
      compareBinary(a.detected_value_raw, b.detected_value_raw),
  );
}

