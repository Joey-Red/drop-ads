import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { DEFAULT_SESSION_STATE, normalizeSessionState } from "../src/core/session.js";

test("session defaults are immutable and explicitly constructed", () => {
  assert.equal(Object.isFrozen(DEFAULT_SESSION_STATE), true);
  assert.equal(Object.isFrozen(DEFAULT_SESSION_STATE.disabledSites), true);
  assert.deepEqual(DEFAULT_SESSION_STATE.disabledSites, []);

  const first = normalizeSessionState(undefined);
  const second = normalizeSessionState(undefined);
  assert.deepEqual(first, { disabledSites: [] });
  assert.deepEqual(second, { disabledSites: [] });
  assert.notEqual(first, second);
  assert.notEqual(first.disabledSites, DEFAULT_SESSION_STATE.disabledSites);
  assert.notEqual(first.disabledSites, second.disabledSites);
});

test("session default construction does not depend on structuredClone", () => {
  const source = fs.readFileSync(new URL("../src/core/session.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /structuredClone/);
  assert.match(source, /EMPTY_SESSION_COLLECTION = Object\.freeze\(\[\]\)/);
});
