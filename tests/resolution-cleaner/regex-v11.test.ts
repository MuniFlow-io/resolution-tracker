import assert from "node:assert/strict";
import { test } from "node:test";
import { detectVariables } from "@/lib/services/resolution-cleaner/detectVariables";
import { SAMPLE_RESOLUTION_TEXT } from "@/tests/resolution-cleaner/fixtures/sampleResolutionText";

test("v1.1 regex: borrower anchor captures borrower entity", () => {
  const groups = detectVariables(SAMPLE_RESOLUTION_TEXT);
  const borrower = groups.find((g) => g.type === "borrower");
  assert.ok(borrower, "Borrower should be detected");
  assert.equal(borrower.detected_value_raw, "Balboa Lee Avenue, L.P.");
});

test("v1.1 regex: borrower supports preposition + descriptor drafting", () => {
  const text =
    'construction by Balboa Gateway LP, a California limited partnership (the "Borrower") is approved.';
  const groups = detectVariables(text);
  const borrower = groups.find((g) => g.type === "borrower");
  assert.ok(borrower, "Borrower preposition+descriptor variant must be detected");
  assert.equal(borrower.detected_value_raw, "Balboa Gateway LP");
});

test("v1.1 regex: funding lender primary detects affiliate drafting", () => {
  const text =
    'Wells Fargo Bank, National Association (or an affiliate thereof) (the "Funding Lender") provides funds.';
  const groups = detectVariables(text);
  const fundingLender = groups.find((g) => g.type === "funding_lender");
  assert.ok(fundingLender, "Funding lender affiliate variant must be detected");
  assert.equal(fundingLender.detected_value_raw, "Wells Fargo Bank, National Association");
});

test("v1.1 regex: funding lender fallback detects non-affiliate drafting", () => {
  const text = 'Acme Capital Partners, LLC (the "Funding Lender") is referenced in this resolution.';
  const groups = detectVariables(text);
  const fundingLender = groups.find((g) => g.type === "funding_lender");
  assert.ok(fundingLender, "Funding lender fallback variant must be detected");
  assert.equal(fundingLender.detected_value_raw, "Acme Capital Partners, LLC");
});

test('v1.1 regex: project known as "..." is captured', () => {
  const groups = detectVariables(SAMPLE_RESOLUTION_TEXT);
  const project = groups.find((g) => g.detected_value_raw === "Sunset Gardens Apartments");
  assert.ok(project, 'Project name from "known as" clause must be detected');
});

test("v1.1 regex: address located at clause is captured", () => {
  const groups = detectVariables(SAMPLE_RESOLUTION_TEXT);
  const address = groups.find((g) =>
    g.detected_value_raw.includes("123 Main Street, San Diego, California 92101"),
  );
  assert.ok(address, "Address from located-at clause must be detected");
});

test("v1.1 regex: address supports 'to be located at' variant", () => {
  const text = "The site is expected to be located at 105 Wisteria Lane (formerly known as 11 Frida Kahlo Way).";
  const groups = detectVariables(text);
  const address = groups.find((g) => g.type === "property_address");
  assert.ok(address, "Address should be captured for 'to be located at' variant");
  assert.equal(address.detected_value_raw, "105 Wisteria Lane (formerly known as 11 Frida Kahlo Way)");
});
