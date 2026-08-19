import test from "node:test";
import assert from "node:assert/strict";
import {
  addUniqueRule,
  normalizeDomainSet,
  removeRule,
  ruleFromUserInput,
  setDomainFlag
} from "../src/core/personal-rules.js";
import { ruleKey } from "../src/core/rules.js";

test("user-input rules are immutable normalized snapshots", () => {
  const rule = ruleFromUserInput("  HTTPS://Example.COM/path#fragment  ");
  assert.equal(Object.isFrozen(rule), true);
  assert.equal(rule.kind, "url");
  assert.equal(rule.value, "https://example.com/path");
});

test("add/remove helpers detach and freeze existing network rules", () => {
  const source = { kind: "domain", value: "Ads.Example.com", resourceTypes: ["script", "image"] };
  const added = addUniqueRule([source], { kind: "domain", value: "tracker.example.com" });
  assert.equal(Object.isFrozen(added), true);
  assert.equal(Object.isFrozen(added[0]), true);
  assert.equal(Object.isFrozen(added[0].resourceTypes), true);
  assert.deepEqual(added[0].resourceTypes, ["image", "script"]);

  source.value = "mutated.example.com";
  source.resourceTypes[0] = "media";
  assert.equal(added[0].value, "ads.example.com");
  assert.deepEqual(added[0].resourceTypes, ["image", "script"]);

  const removed = removeRule(added, ruleKey(added[1]));
  assert.equal(Object.isFrozen(removed), true);
  assert.deepEqual(removed.map((rule) => rule.value), ["ads.example.com"]);
});

test("domain normalization and flags return frozen canonical sets", () => {
  const domains = normalizeDomainSet(["B.example.com", "a.example.com", "A.example.com"]);
  assert.equal(Object.isFrozen(domains), true);
  assert.deepEqual(domains, ["a.example.com", "b.example.com"]);

  const updated = setDomainFlag(domains, "c.example.com", true);
  assert.equal(Object.isFrozen(updated), true);
  assert.deepEqual(updated, ["a.example.com", "b.example.com", "c.example.com"]);
});
