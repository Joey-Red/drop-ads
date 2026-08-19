import assert from "node:assert/strict";
import test from "node:test";

import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

function getterObject(fields, getterKey, value) {
  const object = { ...fields };
  let calls = 0;
  Object.defineProperty(object, getterKey, { enumerable: true, get() { calls += 1; return value; } });
  return { object, calls: () => calls };
}

test("runtime network rule payloads do not execute field getters", () => {
  const { object: rule, calls } = getterObject({ kind: "domain" }, "value", "example.com");
  assert.throws(() => validateBackgroundRuntimeMessage({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule }, "core"));
  assert.equal(calls(), 0);
});

test("runtime resourceTypes arrays do not execute index getters", () => {
  let calls = 0;
  const resourceTypes = ["script"];
  Object.defineProperty(resourceTypes, "0", { enumerable: true, get() { calls += 1; return "script"; } });
  assert.throws(() => validateBackgroundRuntimeMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "example.com", resourceTypes }
  }, "core"));
  assert.equal(calls, 0);
});

test("runtime cosmetic scope arrays do not execute index getters", () => {
  let calls = 0;
  const domains = ["example.com"];
  Object.defineProperty(domains, "0", { enumerable: true, get() { calls += 1; return "example.com"; } });
  assert.throws(() => validateBackgroundRuntimeMessage({
    type: "drop-ads:add-cosmetic-rule",
    field: "personalCosmeticHide",
    rule: { selector: ".ad", domains }
  }, "cosmetic"));
  assert.equal(calls, 0);
});

test("runtime subscription payloads do not execute field getters", () => {
  const { object: subscription, calls } = getterObject({
    id: "test-list",
    title: "Test list",
    format: "hosts"
  }, "sourceUrl", "https://example.com/list.txt");
  assert.throws(() => validateBackgroundRuntimeMessage({ type: "drop-ads:add-subscription", subscription }, "core"));
  assert.equal(calls(), 0);
});
