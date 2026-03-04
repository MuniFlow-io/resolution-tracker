import type { RunSegment } from "@/lib/services/resolution-cleaner/parseDocx";
import type { ConfirmedReplacement } from "@/modules/resolution-cleaner/types/resolutionData";

export interface ReplacementResult {
  modifiedXmlString: string;
  /** group_id → number of occurrences actually replaced. */
  actualReplacementCounts: Record<string, number>;
}

function encodeXmlEntities(s: string): string {
  // Strip characters that are illegal in XML 1.0 (control chars below U+0020
  // except horizontal tab U+0009, line feed U+000A, carriage return U+000D).
  // Leaving these in produces malformed XML that Word refuses to open.
  const stripped = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return stripped
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface XmlEdit {
  xmlContentStart: number;
  xmlContentEnd: number;
  newEncodedText: string;
}

/**
 * For a single flat-text match at [matchStart, matchEnd), compute the XML
 * edits needed across all runs that overlap that range.
 *
 * Handles three cases:
 *   1. Match contained in a single run  → prefix + newValue + suffix
 *   2. Match starts in one run, ends in another  → first: prefix+newValue, last: suffix, middle: ""
 *   3. Match spans > 2 runs  → same logic; intermediate runs are cleared
 */
function editsForMatch(
  runs: RunSegment[],
  matchStart: number,
  matchEnd: number,
  newValue: string,
): XmlEdit[] {
  const affected = runs.filter((r) => r.flatStart < matchEnd && r.flatEnd > matchStart);
  if (affected.length === 0) return [];

  const edits: XmlEdit[] = [];

  for (let i = 0; i < affected.length; i++) {
    const run = affected[i];
    const isFirst = i === 0;
    const isLast = i === affected.length - 1;

    // How much of this run's decodedText is BEFORE the match.
    const prefixLen = Math.max(0, matchStart - run.flatStart);
    // How much of this run's decodedText is AFTER the match.
    const suffixStart = Math.max(0, matchEnd - run.flatStart);

    const prefix = run.decodedText.slice(0, prefixLen);
    const suffix = run.decodedText.slice(suffixStart);

    let newDecoded: string;
    if (isFirst && isLast) {
      newDecoded = prefix + newValue + suffix;
    } else if (isFirst) {
      newDecoded = prefix + newValue;
    } else if (isLast) {
      newDecoded = suffix;
    } else {
      newDecoded = "";
    }

    edits.push({
      xmlContentStart: run.xmlContentStart,
      xmlContentEnd: run.xmlContentEnd,
      newEncodedText: encodeXmlEntities(newDecoded),
    });
  }

  return edits;
}

export function applyReplacements(
  runs: RunSegment[],
  xmlString: string,
  flatText: string,
  confirmedReplacements: ConfirmedReplacement[],
): ReplacementResult {
  // 1. Integrity check — validate every offset against flatText before touching the XML.
  for (const replacement of confirmedReplacements) {
    for (const { start, end } of replacement.confirmed_occurrence_offsets) {
      const actual = flatText.slice(start, end);
      if (actual !== replacement.original_value) {
        throw new Error(
          `Replacement integrity check failed for "${replacement.original_value}". ` +
            `Found "${actual}" at [${start}, ${end}]. No changes were applied.`,
        );
      }
    }
  }

  // 2. Collect all XML edits from all replacements.
  const allEdits: (XmlEdit & { groupId: string })[] = [];

  for (const replacement of confirmedReplacements) {
    for (const { start, end } of replacement.confirmed_occurrence_offsets) {
      const edits = editsForMatch(runs, start, end, replacement.new_value);
      for (const edit of edits) {
        allEdits.push({ ...edit, groupId: replacement.group_id });
      }
    }
  }

  // 3. Sort edits by xmlContentStart DESCENDING so upstream byte positions stay valid.
  allEdits.sort((a, b) => b.xmlContentStart - a.xmlContentStart);

  // 4. Apply edits surgically.
  let modifiedXml = xmlString;
  const actualReplacementCounts: Record<string, number> = {};

  for (const edit of allEdits) {
    const before = modifiedXml.slice(0, edit.xmlContentStart);
    const after = modifiedXml.slice(edit.xmlContentEnd);
    modifiedXml = before + edit.newEncodedText + after;

    // Count only "first run" edits (editsForMatch may produce multiple per occurrence,
    // but the new value is only inserted into the first run).
    // We identify the first-run edit as the one with the lowest xmlContentStart
    // per match, but since we sorted descending we track via groupId occurrence grouping.
    // Simpler: count distinct (groupId, matchStart) pairs — we do that via the
    // confirmed_occurrence_offsets length below.
  }

  // Count = number of occurrence offsets per group (all validated above).
  for (const replacement of confirmedReplacements) {
    actualReplacementCounts[replacement.group_id] =
      replacement.confirmed_occurrence_offsets.length;
  }

  return { modifiedXmlString: modifiedXml, actualReplacementCounts };
}
