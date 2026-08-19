import test from "node:test";
import assert from "node:assert/strict";
import { serializeCommunityPromotionOutputs, serializeCommunityValidationOutputs } from "../tools/community-output.mjs";

test("community workflow output is single-line-field, bounded, and status-consistent", () => {
  const validation = Object.freeze({ valid: true, status: "ready", candidate: "block domain ads.example", reason: "ready" });
  assert.equal(serializeCommunityValidationOutputs(validation), "valid=true\nstatus=ready\ncandidate=block domain ads.example\nreason=ready\n");
  const promotion = Object.freeze({ ...validation, changed: true, listText: "block domain ads.example\n" });
  assert.equal(serializeCommunityPromotionOutputs(promotion), "changed=true\nstatus=ready\ncandidate=block domain ads.example\nreason=ready\n");
  assert.throws(() => serializeCommunityValidationOutputs({ ...validation, reason: "bad\nvalue" }), /invalid/);
  assert.throws(() => serializeCommunityPromotionOutputs({ ...promotion, changed: false }), /does not match status/);
});
