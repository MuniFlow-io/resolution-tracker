import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectVariables } from "@/lib/services/resolution-cleaner/detectVariables";
import { SAMPLE_RESOLUTION_TEXT } from "@/tests/resolution-cleaner/fixtures/sampleResolutionText";

test("golden: normalized detection output matches frozen fixture", () => {
  const groups = detectVariables(SAMPLE_RESOLUTION_TEXT).map((g) => ({
    type: g.type,
    value: g.detected_value_raw,
    count: g.occurrence_count,
    offsets: g.occurrences.map((o) => [o.start_offset, o.end_offset]),
  }));

  const fixturePath = resolve(
    process.cwd(),
    "tests/resolution-cleaner/fixtures/detection.golden.json",
  );
  const expected = JSON.parse(readFileSync(fixturePath, "utf-8")) as unknown;
  assert.deepEqual(groups, expected);
});
