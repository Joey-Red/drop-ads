import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { diffManagedRules } from "../src/core/runtime.js";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

function rule(id = 1_000_001) {
  return {
    id,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: "||example.com^", resourceTypes: ["script"] }
  };
}

test("M393 managed rule canonicalization has explicit structural work bounds", () => {
  assert.match(source, /MANAGED_RULE_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 16, objectFields: 64, arrayEntries: 10_000, values: 50_000 \}\)/);
  assert.match(source, /function canonicalManagedRule\(rule\) \{\s*return boundedJsonData\(rule, MANAGED_RULE_SNAPSHOT_LIMITS, "Managed DNR rule"\);\s*\}/s);
  assert.match(source, /for \(const key of keys\.sort\(\)\)/);
  assert.match(source, /fields must be enumerable own data fields/);
  assert.match(source, /contains a cycle/);
});

test("M393 canonical equality ignores object key insertion order", () => {
  const current = rule();
  const desired = {
    condition: { resourceTypes: ["script"], urlFilter: "||example.com^" },
    action: { type: "block" },
    priority: 1,
    id: 1_000_001
  };
  assert.deepEqual(diffManagedRules([current], [desired]), { removeRuleIds: [], addRules: [] });
});

test("M393 accessors fail without execution and duplicate ids fail closed", () => {
  let getterCalls = 0;
  const hostile = rule();
  Object.defineProperty(hostile, "action", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { type: "allow" };
    }
  });
  assert.throws(() => diffManagedRules([hostile], []));
  assert.equal(getterCalls, 0);
  assert.throws(() => diffManagedRules([rule()], [rule(), rule()]));
});

test("M393 added rules are detached canonical data", () => {
  const desired = rule();
  const delta = diffManagedRules([], [desired]);
  assert.equal(delta.addRules.length, 1);
  assert.notEqual(delta.addRules[0], desired);
  desired.action.type = "allow";
  assert.equal(delta.addRules[0].action.type, "block");
});

test("M393 diff records canonical signatures once and avoids direct id-map construction", () => {
  assert.match(source, /signature: JSON\.stringify\(canonical\)/);
  assert.match(source, /currentRecord\.signature !== desiredRecord\.signature/);
  assert.match(source, /addRules\.push\(desiredRecord\.rule\)/);
  assert.doesNotMatch(source, /new Map\(currentRules\.map\(\(rule\) => \[rule\.id, rule\]\)\)/);
});
