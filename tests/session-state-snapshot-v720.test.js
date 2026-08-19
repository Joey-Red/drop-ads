import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSessionState } from "../src/core/session.js";

test("normalized session state is detached and immutable", () => {
  const disabledSites = ["Example.COM", "example.com", "other.example"];
  const normalized = normalizeSessionState({ disabledSites });

  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.disabledSites), true);
  assert.deepEqual(normalized.disabledSites, ["example.com", "other.example"]);
  assert.notEqual(normalized.disabledSites, disabledSites);

  disabledSites[0] = "changed.example";
  assert.deepEqual(normalized.disabledSites, ["example.com", "other.example"]);
  assert.throws(() => { normalized.disabledSites.push("new.example"); }, TypeError);
  assert.throws(() => { normalized.disabledSites = []; }, TypeError);
});

test("default normalized session snapshots are independently immutable", () => {
  const first = normalizeSessionState(undefined);
  const second = normalizeSessionState(undefined);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.disabledSites), true);
  assert.notEqual(first, second);
  assert.notEqual(first.disabledSites, second.disabledSites);
});
