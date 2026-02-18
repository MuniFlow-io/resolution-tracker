/**
 * Core service unit tests — run with: npx ts-node --project tsconfig.test.json tests/services.test.ts
 *
 * Tests the three atomic services that form the processing pipeline:
 *   1. Regex pattern detection
 *   2. detectVariables grouping logic
 *   3. replacementEngine run-level replacement
 */

import assert from "node:assert/strict";
import { test } from "node:test";

// ─── Helpers ────────────────────────────────────────────────────────────────

function pass(label: string) {
  console.log(`  ✓  ${label}`);
}

// ─── 1. Regex patterns ───────────────────────────────────────────────────────

test("Regex: long-month date matches", () => {
  const { LONG_DATE_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  const samples = [
    "September 1, 2024",
    "January 15, 2025",
    "December 31, 2026",
  ];
  for (const s of samples) {
    LONG_DATE_REGEX.lastIndex = 0;
    assert.ok(LONG_DATE_REGEX.test(s), `Should match: ${s}`);
    pass(s);
  }
});

test("Regex: long-month date does NOT match partials", () => {
  const { LONG_DATE_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  const notDates = ["September 2024", "1, 2024", "Sept 1 2024"];
  for (const s of notDates) {
    LONG_DATE_REGEX.lastIndex = 0;
    assert.ok(!LONG_DATE_REGEX.test(s), `Should NOT match: ${s}`);
    pass(`Not a date: "${s}"`);
  }
});

test("Regex: currency matches comma-grouped amounts", () => {
  const { CURRENCY_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  const amounts = ["$84,116,000", "$5,000,000", "$1,000"];
  for (const a of amounts) {
    CURRENCY_REGEX.lastIndex = 0;
    assert.ok(CURRENCY_REGEX.test(a), `Should match: ${a}`);
    pass(a);
  }
});

test("Regex: currency does NOT match non-comma amounts", () => {
  const { CURRENCY_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  CURRENCY_REGEX.lastIndex = 0;
  assert.ok(!CURRENCY_REGEX.test("$1000"), 'Should NOT match "$1000" (no commas)');
  pass('No match for "$1000"');
});

test("Regex: series matches hyphenated and non-hyphenated", () => {
  const {
    SERIES_HYPHEN_REGEX,
    SERIES_NOHYPHEN_REGEX,
  } = require("../lib/services/resolution-cleaner/regexPatterns");

  SERIES_HYPHEN_REGEX.lastIndex = 0;
  assert.ok(SERIES_HYPHEN_REGEX.test("Series 2024-A"), "Series 2024-A");
  pass("Series 2024-A");

  SERIES_NOHYPHEN_REGEX.lastIndex = 0;
  assert.ok(SERIES_NOHYPHEN_REGEX.test("Series 2026C"), "Series 2026C");
  pass("Series 2026C");
});

test("Regex: borrower anchor extracts entity name", () => {
  const { BORROWER_ANCHOR_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  const text = `Balboa Lee Avenue, L.P. (the "Borrower")`;
  BORROWER_ANCHOR_REGEX.lastIndex = 0;
  const m = BORROWER_ANCHOR_REGEX.exec(text);
  assert.ok(m, "Should match borrower pattern");
  assert.equal(m![1].trim(), "Balboa Lee Avenue, L.P.");
  pass(`Borrower extracted: "${m![1].trim()}"`);
});

test("Regex: unit count matches N-unit pattern", () => {
  const { UNIT_COUNT_REGEX } = require("../lib/services/resolution-cleaner/regexPatterns");
  UNIT_COUNT_REGEX.lastIndex = 0;
  const m = UNIT_COUNT_REGEX.exec("a 127-unit apartment complex");
  assert.ok(m, "Should match unit count");
  assert.equal(m![1], "127");
  pass(`Unit count extracted: ${m![1]}`);
});

// ─── 2. detectVariables ───────────────────────────────────────────────────────

test("detectVariables: groups exact string matches", () => {
  const { detectVariables } = require("../lib/services/resolution-cleaner/detectVariables");

  const flatText = `
    This resolution dated September 1, 2024 and September 1, 2024 again.
    The amount is $84,116,000 and $5,000,000.
    Series 2024-A bonds.
    Balboa Lee Avenue, L.P. (the "Borrower").
    127-unit residential project.
  `;

  const groups = detectVariables(flatText);
  const byType = (t: string) => groups.filter((g: { type: string }) => g.type === t);

  // Dates: "September 1, 2024" should appear once as a group with 2 occurrences
  const dateGroups = byType("date");
  const sepDate = dateGroups.find((g: { detected_value_raw: string }) => g.detected_value_raw === "September 1, 2024");
  assert.ok(sepDate, "Should detect September 1, 2024");
  assert.equal(sepDate.occurrence_count, 2, "Should group 2 occurrences");
  pass(`September 1, 2024 — 2 occurrences grouped`);

  // Currency: two distinct groups
  const currGroups = byType("currency");
  assert.ok(currGroups.length >= 2, "Should detect both currency amounts");
  pass(`${currGroups.length} currency groups detected`);

  // Series
  const seriesGroups = byType("series");
  assert.ok(seriesGroups.length >= 1, "Should detect Series 2024-A");
  pass("Series 2024-A detected");

  // Borrower (anchored)
  const borrowerGroups = byType("borrower");
  assert.ok(borrowerGroups.length >= 1, "Should detect borrower");
  assert.ok(
    borrowerGroups[0].detected_value_raw.includes("Balboa Lee Avenue"),
    "Borrower value should include entity name",
  );
  pass(`Borrower: "${borrowerGroups[0].detected_value_raw}"`);

  // Unit count
  const unitGroups = byType("unit_count");
  assert.ok(unitGroups.length >= 1, "Should detect 127-unit");
  pass("127-unit detected");
});

test("detectVariables: issuer is marked locked", () => {
  const { detectVariables } = require("../lib/services/resolution-cleaner/detectVariables");
  const text = `The City of San Jose (the "Issuer") hereby resolves.`;
  const groups = detectVariables(text);
  const issuers = groups.filter((g: { type: string }) => g.type === "issuer");
  assert.ok(issuers.length >= 1, "Should detect issuer");
  assert.equal(issuers[0].is_locked, true, "Issuer must be locked");
  pass(`Issuer locked: "${issuers[0].detected_value_raw}"`);
});

test("detectVariables: does NOT detect borrower without anchor", () => {
  const { detectVariables } = require("../lib/services/resolution-cleaner/detectVariables");
  // No (the "Borrower") anchor → should not be detected as borrower
  const text = "Balboa Lee Avenue, L.P. entered into the agreement.";
  const groups = detectVariables(text);
  const borrowers = groups.filter((g: { type: string }) => g.type === "borrower");
  assert.equal(borrowers.length, 0, "Should NOT detect borrower without anchor");
  pass("No anchor → no borrower detection");
});

// ─── 3. replacementEngine ────────────────────────────────────────────────────

test("replacementEngine: replaces text in a single run", () => {
  const { applyReplacements } = require("../lib/services/resolution-cleaner/replacementEngine");

  // Minimal Word XML with one paragraph and one run
  const xmlString = `<w:document><w:body><w:p><w:r><w:t>The date is September 1, 2024 in this document.</w:t></w:r></w:p></w:body></w:document>`;

  // Build a run segment matching the w:t content
  const contentStart = xmlString.indexOf(">", xmlString.indexOf("<w:t")) + 1;
  const contentEnd = xmlString.indexOf("</w:t>");
  const decodedText = "The date is September 1, 2024 in this document.";

  const runs = [
    {
      flatStart: 0,
      flatEnd: decodedText.length,
      decodedText,
      xmlContentStart: contentStart,
      xmlContentEnd: contentEnd,
    },
  ];

  const flatText = decodedText;
  const matchStart = flatText.indexOf("September 1, 2024");
  const matchEnd = matchStart + "September 1, 2024".length;

  const result = applyReplacements(runs, xmlString, flatText, [
    {
      group_id: "test-1",
      original_value: "September 1, 2024",
      new_value: "June 1, 2026",
      confirmed_occurrence_offsets: [{ start: matchStart, end: matchEnd }],
      term_key: "dated_date",
    },
  ]);

  assert.ok(
    result.modifiedXmlString.includes("June 1, 2026"),
    "Modified XML should contain new value",
  );
  assert.ok(
    !result.modifiedXmlString.includes("September 1, 2024"),
    "Modified XML should not contain old value",
  );
  assert.equal(result.actualReplacementCounts["test-1"], 1);
  pass("Single-run replacement: September 1, 2024 → June 1, 2026");
});

test("replacementEngine: integrity check throws on offset mismatch", () => {
  const { applyReplacements } = require("../lib/services/resolution-cleaner/replacementEngine");

  const xmlString = `<w:t>Some text here.</w:t>`;
  const flatText = "Some text here.";
  const runs = [
    {
      flatStart: 0,
      flatEnd: flatText.length,
      decodedText: flatText,
      xmlContentStart: 5,
      xmlContentEnd: 5 + flatText.length,
    },
  ];

  assert.throws(
    () =>
      applyReplacements(runs, xmlString, flatText, [
        {
          group_id: "test-bad",
          original_value: "wrong value",
          new_value: "new",
          confirmed_occurrence_offsets: [{ start: 0, end: 11 }],
          term_key: null,
        },
      ]),
    /integrity check failed/i,
  );
  pass("Integrity check throws on mismatch — no silent corruption");
});

test("replacementEngine: handles run-spanning replacement", () => {
  const { applyReplacements } = require("../lib/services/resolution-cleaner/replacementEngine");

  // Simulate Word splitting "September 1, 2024" across two runs:
  // Run 1: "The date is September 1,"
  // Run 2: " 2024 here."
  const text1 = "The date is September 1,";
  const text2 = " 2024 here.";
  const flatText = text1 + text2;

  // Build minimal XML with two runs
  const xml = `<w:p><w:r><w:t>${text1}</w:t></w:r><w:r><w:t>${text2}</w:t></w:r></w:p>`;

  const run1ContentStart = xml.indexOf(">", xml.indexOf("<w:t")) + 1;
  const run1ContentEnd = run1ContentStart + text1.length;
  const run2ContentStart = xml.lastIndexOf(">", xml.lastIndexOf("</w:t>") - 1) + 1;
  const run2ContentEnd = run2ContentStart + text2.length;

  const runs = [
    {
      flatStart: 0,
      flatEnd: text1.length,
      decodedText: text1,
      xmlContentStart: run1ContentStart,
      xmlContentEnd: run1ContentEnd,
    },
    {
      flatStart: text1.length,
      flatEnd: flatText.length,
      decodedText: text2,
      xmlContentStart: run2ContentStart,
      xmlContentEnd: run2ContentEnd,
    },
  ];

  const original = "September 1, 2024";
  const matchStart = flatText.indexOf(original);
  const matchEnd = matchStart + original.length;

  const result = applyReplacements(runs, xml, flatText, [
    {
      group_id: "span-test",
      original_value: original,
      new_value: "June 1, 2026",
      confirmed_occurrence_offsets: [{ start: matchStart, end: matchEnd }],
      term_key: "dated_date",
    },
  ]);

  // Run 1 should now end with "June 1, 2026" and run 2 should be just " here."
  assert.ok(result.modifiedXmlString.includes("June 1, 2026"), "New value inserted");
  assert.ok(!result.modifiedXmlString.includes("September 1,"), "Old split text gone from run 1");
  assert.ok(!result.modifiedXmlString.includes("2024 here"), "Old split text gone from run 2");
  pass("Run-spanning replacement handled correctly");
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n✅  All tests passed\n");
