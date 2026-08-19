import test from "node:test";
import assert from "node:assert/strict";
import { serializeCommunityPromotionOutputs, serializeCommunityValidationOutputs } from "../tools/community-output.mjs";

test("M882 workflow output rejects multiline or oversized values", () => {
  const valid = Object.freeze({ valid: true, status: "ready", candidate: "block domain ads.example.com", reason: "ready" });
  assert.match(serializeCommunityValidationOutputs(valid), /^valid=true\nstatus=ready\n/);
  assert.throws(() => serializeCommunityValidationOutputs({ ...valid, reason: "bad\nreason" }), /invalid/);

  const promoted = Object.freeze({
    valid: true,
    changed: true,
    status: "ready",
    candidate: "block domain ads.example.com",
    reason: "ready",
    listText: "block domain ads.example.com\n"
  });
  assert.match(serializeCommunityPromotionOutputs(promoted), /^changed=true\nstatus=ready\n/);
  assert.throws(() => serializeCommunityPromotionOutputs({ ...promoted, candidate: "x".repeat(2049) }), /invalid/);
});
