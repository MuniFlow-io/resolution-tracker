import assert from "node:assert/strict";
import { test } from "node:test";
import { detectVariables } from "@/lib/services/resolution-cleaner/detectVariables";

test("hard filter: rejects borrower captures containing WHEREAS", () => {
  const text = `to Acme Holdings, LLC, WHEREAS a prior clause exists (the "Borrower").`;
  const groups = detectVariables(text);
  const borrower = groups.find((g) => g.type === "borrower");
  assert.equal(
    borrower,
    undefined,
    'Borrower capture containing "WHEREAS" should be rejected by hard filters',
  );
});

test("hard filter: rejects borrower captures containing Section", () => {
  const text = `to Acme Holdings, LLC, Section 9.2 governs this term (the "Borrower").`;
  const groups = detectVariables(text);
  const borrower = groups.find((g) => g.type === "borrower");
  assert.equal(
    borrower,
    undefined,
    'Borrower capture containing "Section" should be rejected by hard filters',
  );
});

test("hard filter: rejects captures with too many commas before anchor", () => {
  const text = `to Acme, Parent, Holdings, LLC (the "Borrower") will execute the agreement.`;
  const groups = detectVariables(text);
  const borrower = groups.find((g) => g.type === "borrower");
  assert.equal(
    borrower,
    undefined,
    "Borrower capture with >2 commas before anchor should be rejected by hard filters",
  );
});
