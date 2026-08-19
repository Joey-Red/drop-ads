import test from "node:test";
import assert from "node:assert/strict";
import { communityCandidateFromRule } from "../src/core/community.js";

test("community candidates are canonical detached immutable domain records", () => {
  const source = { kind: "domain", value: "Ads.Example.com" };
  const candidate = communityCandidateFromRule(source);
  assert.deepEqual(candidate, { kind: "domain", value: "ads.example.com" });
  assert.equal(Object.isFrozen(candidate), true);
  assert.notEqual(candidate, source);
  assert.throws(() => { candidate.value = "changed.example.com"; }, TypeError);
});
