import { v4 as uuidv4 } from "uuid";
import { PATTERN_REGISTRY } from "@/lib/services/resolution-cleaner/regexPatterns";
import type {
  OccurrenceOffset,
  VariableGroup,
} from "@/modules/resolution-cleaner/types/resolutionData";

function stripXmlFragments(s: string): string {
  // Remove XML/HTML-like tags that can appear in flatText when a docx <w:t> node
  // contains entity-encoded angle brackets (e.g. &lt;wtrPr&gt;). These are artifacts
  // of the document XML structure and are meaningless to the user.
  return s.replace(/<[^>]{0,300}>/g, " ").replace(/\s{2,}/g, " ");
}

function buildContext(text: string, start: number, end: number) {
  const before = text.slice(Math.max(0, start - 60), start);
  const after = text.slice(end, Math.min(text.length, end + 60));
  return {
    context_before: stripXmlFragments(before),
    context_after: stripXmlFragments(after),
  };
}

export function detectVariables(flatText: string): VariableGroup[] {
  const map = new Map<string, VariableGroup>();

  for (const { type, regex, term_key, is_locked } of PATTERN_REGISTRY) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = regex.exec(flatText)) !== null) {
      const raw = match[1]?.trim() ?? match[0].trim();
      const baseIndex = match.index;
      const offsetWithinMatch = match[0].indexOf(raw);
      const start_offset = baseIndex + (offsetWithinMatch >= 0 ? offsetWithinMatch : 0);
      const end_offset = start_offset + raw.length;
      const key = `${type}:${raw}`;

      const occurrenceBase: Omit<OccurrenceOffset, "index"> = {
        match_text: raw,
        start_offset,
        end_offset,
        ...buildContext(flatText, start_offset, end_offset),
      };

      const existing = map.get(key);
      if (existing) {
        const index = existing.occurrences.length;
        existing.occurrences.push({ ...occurrenceBase, index });
        existing.occurrence_count += 1;
      } else {
        map.set(key, {
          group_id: uuidv4(),
          type,
          detected_value_raw: raw,
          occurrences: [{ ...occurrenceBase, index: 0 }],
          occurrence_count: 1,
          term_key,
          is_locked,
        });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.occurrence_count - a.occurrence_count || a.detected_value_raw.localeCompare(b.detected_value_raw),
  );
}

