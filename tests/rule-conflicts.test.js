import test from "node:test";
import assert from "node:assert/strict";
import { isPersonalBlockOverridden, personalRuleConflictKeys } from "../src/core/rule-conflicts.js";
import { ruleKey } from "../src/core/rules.js";

test("personal rule conflicts are exact by normalized rule key", () => {
  const block = [
    { kind: "domain", value: "ads.example" },
    { kind: "url", value: "https://cdn.example/ad.js" }
  ];
  const allow = [
    { kind: "domain", value: "ads.example" },
    { kind: "domain", value: "cdn.example" }
  ];

  const conflicts = personalRuleConflictKeys(block, allow);
  assert.deepEqual([...conflicts], [ruleKey({ kind: "domain", value: "ads.example" })]);
  assert.equal(isPersonalBlockOverridden(block[0], allow), true);
  assert.equal(isPersonalBlockOverridden(block[1], allow), false);
});
