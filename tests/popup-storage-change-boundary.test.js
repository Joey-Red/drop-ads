import test from "node:test";
import assert from "node:assert/strict";
import { popupStorageChangeAffectsPolicy } from "../src/core/popup-boundary.js";

const LOCAL = "dropAdsState";
const SESSION = "dropAdsSessionState";

test("popup storage routing recognizes only the relevant area/key pair", () => {
  assert.equal(popupStorageChangeAffectsPolicy({ [LOCAL]: { newValue: {} }, other: {} }, "local", LOCAL, SESSION), true);
  assert.equal(popupStorageChangeAffectsPolicy({ [SESSION]: { newValue: {} } }, "session", LOCAL, SESSION), true);
  assert.equal(popupStorageChangeAffectsPolicy({ [LOCAL]: {} }, "session", LOCAL, SESSION), false);
  assert.equal(popupStorageChangeAffectsPolicy({ unrelated: {} }, "local", LOCAL, SESSION), false);
  assert.equal(popupStorageChangeAffectsPolicy({ [LOCAL]: {} }, "sync", LOCAL, SESSION), false);
});

test("popup storage routing does not execute accessors", () => {
  let reads = 0;
  const changes = {};
  Object.defineProperty(changes, LOCAL, { enumerable: true, get() { reads += 1; return {}; } });
  assert.equal(popupStorageChangeAffectsPolicy(changes, "local", LOCAL, SESSION), false);
  assert.equal(reads, 0);
});

test("popup storage routing rejects custom prototypes and trapped descriptors", () => {
  assert.equal(popupStorageChangeAffectsPolicy(Object.assign(Object.create({}), { [LOCAL]: {} }), "local", LOCAL, SESSION), false);
  const changes = new Proxy({ [LOCAL]: {} }, { getOwnPropertyDescriptor() { throw new Error("trap"); } });
  assert.equal(popupStorageChangeAffectsPolicy(changes, "local", LOCAL, SESSION), false);
});
