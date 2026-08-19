import test from "node:test";
import assert from "node:assert/strict";
import {
  COOKIE_RULE_ID,
  COOKIE_RULE_PRIORITY,
  MANAGED_RULE_ID_MAX,
  MANAGED_RULE_ID_MIN,
  RULE_TIERS
} from "../src/core/rules.js";
import { auditDnrLayout } from "../tools/dnr-layout-audit.mjs";

function current(overrides = {}) {
  return {
    tiers: structuredClone(RULE_TIERS),
    cookieRuleId: COOKIE_RULE_ID,
    cookiePriority: COOKIE_RULE_PRIORITY,
    managedMin: MANAGED_RULE_ID_MIN,
    managedMax: MANAGED_RULE_ID_MAX,
    staticRules: [],
    ...overrides
  };
}

test("current managed DNR namespace and priority layout is valid", () => {
  assert.deepEqual(auditDnrLayout(current()), {
    tiers: 4,
    managedMin: MANAGED_RULE_ID_MIN,
    managedMax: MANAGED_RULE_ID_MAX,
    cookieRuleId: COOKIE_RULE_ID
  });
});

test("tier overlap and reversed ranges fail explicitly", () => {
  const overlap = current();
  overlap.tiers.communityAllow.idStart = overlap.tiers.communityBlock.idEnd;
  assert.throws(() => auditDnrLayout(overlap), /id overlap/);

  const reversed = current();
  reversed.tiers.personalBlock.idStart = reversed.tiers.personalBlock.idEnd + 1;
  assert.throws(() => auditDnrLayout(reversed), /range is reversed/);
});

test("priority inversion is rejected", () => {
  const layout = current();
  layout.tiers.personalBlock.priority = layout.tiers.communityAllow.priority;
  assert.throws(() => auditDnrLayout(layout), /priority precedence drift/);
});

test("cookie id collision and cookie priority escalation are rejected", () => {
  assert.throws(() => auditDnrLayout(current({ cookieRuleId: RULE_TIERS.personalAllow.idStart })), /collides/);
  assert.throws(() => auditDnrLayout(current({ cookiePriority: RULE_TIERS.communityBlock.priority })), /COOKIE_RULE_PRIORITY/);
});

test("managed envelope drift is rejected", () => {
  assert.throws(() => auditDnrLayout(current({ managedMin: MANAGED_RULE_ID_MIN - 1 })), /MANAGED_RULE_ID_MIN/);
  assert.throws(() => auditDnrLayout(current({ managedMax: MANAGED_RULE_ID_MAX + 1 })), /MANAGED_RULE_ID_MAX/);
});

test("Firefox static compatibility rules cannot collide with managed dynamic ids", () => {
  assert.throws(() => auditDnrLayout(current({ staticRules: [{ id: MANAGED_RULE_ID_MIN, priority: 1, action: { type: "block" }, condition: {} }] })), /collides with the managed dynamic namespace/);
  assert.doesNotThrow(() => auditDnrLayout(current({ staticRules: [{ id: 1, priority: 1, action: { type: "block" }, condition: {} }] })));
});
