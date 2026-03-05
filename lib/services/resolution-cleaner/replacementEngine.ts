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
function runIndicesForMatch(runs: RunSegment[], matchStart: number, matchEnd: number): number[] {
  const affected: number[] = [];
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    if (run.flatStart < matchEnd && run.flatEnd > matchStart) {
      affected.push(i);
    }
  }
  return affected;
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

  // 2. Apply occurrences against mutable run text first.
  // This avoids stale XML byte offsets when multiple matches touch the same run.
  const mutableRunTexts = runs.map((run) => run.decodedText);
  type OccurrenceEdit = { groupId: string; start: number; end: number; newValue: string };
  const occurrences: OccurrenceEdit[] = [];
  for (const replacement of confirmedReplacements) {
    for (const occurrence of replacement.confirmed_occurrence_offsets) {
      occurrences.push({
        groupId: replacement.group_id,
        start: occurrence.start,
        end: occurrence.end,
        newValue: replacement.new_value,
      });
    }
  }

  // Process from right-to-left so flat offsets remain stable.
  occurrences.sort((a, b) => (b.start - a.start) || (b.end - a.end));
  const actualReplacementCounts: Record<string, number> = {};
  for (const replacement of confirmedReplacements) {
    actualReplacementCounts[replacement.group_id] = 0;
  }

  for (const occurrence of occurrences) {
    const affectedIndices = runIndicesForMatch(runs, occurrence.start, occurrence.end);
    if (affectedIndices.length === 0) continue;

    for (let i = 0; i < affectedIndices.length; i += 1) {
      const runIndex = affectedIndices[i];
      const run = runs[runIndex];
      const isFirst = i === 0;
      const isLast = i === affectedIndices.length - 1;

      const prefixLen = Math.max(0, occurrence.start - run.flatStart);
      const suffixStart = Math.max(0, occurrence.end - run.flatStart);

      const currentText = mutableRunTexts[runIndex];
      const prefix = currentText.slice(0, prefixLen);
      const suffix = currentText.slice(suffixStart);

      if (isFirst && isLast) {
        mutableRunTexts[runIndex] = prefix + occurrence.newValue + suffix;
      } else if (isFirst) {
        mutableRunTexts[runIndex] = prefix + occurrence.newValue;
      } else if (isLast) {
        mutableRunTexts[runIndex] = suffix;
      } else {
        mutableRunTexts[runIndex] = "";
      }
    }

    actualReplacementCounts[occurrence.groupId] =
      (actualReplacementCounts[occurrence.groupId] ?? 0) + 1;
  }

  // 3. Emit one XML edit per run and apply right-to-left.
  const runEdits: XmlEdit[] = [];
  for (let i = 0; i < runs.length; i += 1) {
    if (mutableRunTexts[i] === runs[i].decodedText) continue;
    runEdits.push({
      xmlContentStart: runs[i].xmlContentStart,
      xmlContentEnd: runs[i].xmlContentEnd,
      newEncodedText: encodeXmlEntities(mutableRunTexts[i]),
    });
  }
  runEdits.sort((a, b) => b.xmlContentStart - a.xmlContentStart);

  let modifiedXml = xmlString;
  for (const edit of runEdits) {
    const before = modifiedXml.slice(0, edit.xmlContentStart);
    const after = modifiedXml.slice(edit.xmlContentEnd);
    modifiedXml = before + edit.newEncodedText + after;
  }

  return { modifiedXmlString: modifiedXml, actualReplacementCounts };
}
