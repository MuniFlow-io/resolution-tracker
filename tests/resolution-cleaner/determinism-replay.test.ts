import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { detectVariables } from "@/lib/services/resolution-cleaner/detectVariables";
import { SAMPLE_RESOLUTION_TEXT } from "@/tests/resolution-cleaner/fixtures/sampleResolutionText";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

test("determinism replay: 100 runs produce identical group IDs and payload hash", () => {
  const iterations = 100;
  const snapshots: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const groups = detectVariables(SAMPLE_RESOLUTION_TEXT);
    snapshots.push(JSON.stringify(groups));
  }

  const baseline = snapshots[0];
  const baselineHash = hash(baseline);
  for (let i = 1; i < snapshots.length; i++) {
    assert.equal(
      hash(snapshots[i]),
      baselineHash,
      `Determinism regression at run ${i + 1}: output hash changed`,
    );
  }
});
