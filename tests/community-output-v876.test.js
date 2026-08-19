import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { serializeCommunityPromotionOutputs, serializeCommunityValidationOutputs } from "../tools/community-output.mjs";

test("community workflow outputs are one-line bounded own-data fields", () => {
  const validation = Object.freeze({ valid: true, status: "ready", candidate: "block domain ads.example.com", reason: "Ready" });
  assert.equal(
    serializeCommunityValidationOutputs(validation),
    "valid=true\nstatus=ready\ncandidate=block domain ads.example.com\nreason=Ready\n"
  );

  const promotion = Object.freeze({
    valid: true,
    status: "ready",
    candidate: "block domain ads.example.com",
    reason: "Ready",
    changed: true,
    listText: "# community\nblock domain ads.example.com\n"
  });
  const serialized = serializeCommunityPromotionOutputs(promotion);
  assert.match(serialized, /^changed=true\nstatus=ready\n/);
  assert.doesNotMatch(serialized, /# community|listText/);
  assert.throws(() => serializeCommunityPromotionOutputs({ ...promotion, reason: "bad\nvalue" }), /invalid/);
});

test("community workflow serializers reject descriptor and shape drift", () => {
  const promotion = {
    valid: true,
    status: "ready",
    candidate: "block domain ads.example.com",
    reason: "Ready",
    changed: true,
    listText: "block domain ads.example.com\n"
  };
  assert.throws(() => serializeCommunityPromotionOutputs({ ...promotion, extra: true }), /unexpected fields/);
  assert.throws(() => serializeCommunityPromotionOutputs({ ...promotion, changed: false }), /changed state/);
  assert.throws(() => serializeCommunityValidationOutputs({ valid: false, status: "invalid", candidate: "block domain ads.example.com", reason: "bad" }), /must not include a candidate/);
});

test("community CLIs use the strict serializer", () => {
  const check = fs.readFileSync(new URL("../tools/check-community-submission.mjs", import.meta.url), "utf8");
  const promote = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");
  assert.match(check, /serializeCommunityValidationOutputs/);
  assert.match(promote, /serializeCommunityPromotionOutputs/);
  assert.doesNotMatch(check, /lines\.join/);
  assert.doesNotMatch(promote, /lines\.join/);
});
