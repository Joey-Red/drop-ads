import test from "node:test";
import assert from "node:assert/strict";
import { snapshotCommunityRuleInput } from "../src/core/community-boundary.js";
import { communityCandidateFromRule, isCommunityCandidateEligible } from "../src/core/community.js";

test("community candidate input rejects accessors without invoking them", () => {
  let touched = false;
  const candidate = { kind: "domain" };
  Object.defineProperty(candidate, "value", { enumerable: true, get() { touched = true; return "ads.example.com"; } });
  assert.throws(() => snapshotCommunityRuleInput(candidate));
  assert.equal(touched, false);
});

test("community candidate input rejects extra fields and custom prototypes", () => {
  assert.throws(() => snapshotCommunityRuleInput({ kind: "domain", value: "ads.example.com", extra: true }));
  assert.throws(() => snapshotCommunityRuleInput(Object.assign(Object.create({}), { kind: "domain", value: "ads.example.com" })));
});

test("eligible exact URL is reduced to an immutable public domain candidate", () => {
  const input = { kind: "url", value: "https://ads.example.com/path?source=page#fragment" };
  assert.equal(isCommunityCandidateEligible(input), true);
  const candidate = communityCandidateFromRule(input);
  assert.deepEqual(candidate, { kind: "domain", value: "ads.example.com" });
  assert.equal(Object.isFrozen(candidate), true);
});

test("patterns and resource-scoped rules are not eligible", () => {
  assert.equal(isCommunityCandidateEligible({ kind: "pattern", value: "||ads.example.com^" }), false);
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "ads.example.com", resourceTypes: ["script"] }), false);
});
