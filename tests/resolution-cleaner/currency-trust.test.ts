import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyReplacements } from "@/lib/services/resolution-cleaner/replacementEngine";

function fileText(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf-8");
}

test("currency trust: replacement form must not mutate user currency input", () => {
  const replaceForm = fileText("modules/resolution-cleaner/components/ReplaceForm.tsx");
  assert.equal(
    replaceForm.includes("formatCurrencyInput("),
    false,
    "Replace form should preserve literal user input and avoid formatter mutation",
  );
});

test("currency trust: replacement API path must not numerically coerce values", () => {
  const replaceApi = fileText("pages/api/resolution-cleaner/replace.ts");
  assert.equal(replaceApi.includes("Number("), false, "Replacement path should not use Number()");
  assert.equal(replaceApi.includes("parseInt("), false, "Replacement path should not use parseInt()");
  assert.equal(replaceApi.includes("parseFloat("), false, "Replacement path should not use parseFloat()");
});

test("currency trust: comma-formatted currency is preserved exactly in XML output", () => {
  const xmlString = `<w:t>Amount: $84,116,000</w:t>`;
  const flatText = "Amount: $84,116,000";
  const start = flatText.indexOf("$84,116,000");
  const end = start + "$84,116,000".length;
  const runs = [
    {
      flatStart: 0,
      flatEnd: flatText.length,
      decodedText: flatText,
      xmlContentStart: 5,
      xmlContentEnd: 5 + flatText.length,
    },
  ];

  const result = applyReplacements(runs, xmlString, flatText, [
    {
      group_id: "currency-1",
      original_value: "$84,116,000",
      new_value: "$112,711,100",
      confirmed_occurrence_offsets: [{ start, end }],
      term_key: null,
    },
  ]);

  assert.ok(result.modifiedXmlString.includes("$112,711,100"));
});

test("currency trust: unformatted numeric currency string is preserved exactly in XML output", () => {
  const xmlString = `<w:t>Amount: $84,116,000</w:t>`;
  const flatText = "Amount: $84,116,000";
  const start = flatText.indexOf("$84,116,000");
  const end = start + "$84,116,000".length;
  const runs = [
    {
      flatStart: 0,
      flatEnd: flatText.length,
      decodedText: flatText,
      xmlContentStart: 5,
      xmlContentEnd: 5 + flatText.length,
    },
  ];

  const result = applyReplacements(runs, xmlString, flatText, [
    {
      group_id: "currency-2",
      original_value: "$84,116,000",
      new_value: "$112711100",
      confirmed_occurrence_offsets: [{ start, end }],
      term_key: null,
    },
  ]);

  assert.ok(result.modifiedXmlString.includes("$112711100"));
});
