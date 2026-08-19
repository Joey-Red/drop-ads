import test from "node:test";
import assert from "node:assert/strict";
import { isRelevantOptionsStorageChange } from "../src/core/options-boundary.js";

const KEY = "dropAdsState";

test("Settings storage routing accepts relevant local own-data changes and ignores unrelated areas/keys", () => {
  assert.equal(isRelevantOptionsStorageChange({ [KEY]: { newValue: {} } }, "local", KEY), true);
  assert.equal(isRelevantOptionsStorageChange({ other: true, [KEY]: { oldValue: {} } }, "local", KEY), true);
  assert.equal(isRelevantOptionsStorageChange({ [KEY]: true }, "session", KEY), false);
  assert.equal(isRelevantOptionsStorageChange({ other: true }, "local", KEY), false);
});

test("Settings storage routing rejects accessor and custom-prototype containers without getter execution", () => {
  let getterCalls = 0;
  const changes = {};
  Object.defineProperty(changes, KEY, {
    enumerable: true,
    get() { getterCalls += 1; return {}; }
  });
  assert.equal(isRelevantOptionsStorageChange(changes, "local", KEY), false);
  assert.equal(getterCalls, 0);

  const custom = Object.create({ inherited: true });
  custom[KEY] = true;
  assert.equal(isRelevantOptionsStorageChange(custom, "local", KEY), false);
});

test("Settings storage routing contains Proxy descriptor traps", () => {
  const trapped = new Proxy({}, {
    getOwnPropertyDescriptor() { throw new Error("trap"); }
  });
  assert.equal(isRelevantOptionsStorageChange(trapped, "local", KEY), false);
});

test("Settings storage routing rejects invalid storage keys", () => {
  assert.equal(isRelevantOptionsStorageChange({ [KEY]: true }, "local", ""), false);
  assert.equal(isRelevantOptionsStorageChange({ [KEY]: true }, "local", null), false);
});
