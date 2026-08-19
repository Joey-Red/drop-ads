import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M391 policy snapshots carry explicit depth, field, array and visited-value ceilings", () => {
  assert.match(source, /POLICY_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 16, objectFields: 64, arrayEntries: 10_000, values: 250_000 \}\)/);
  assert.match(source, /state\.visited \+= 1;/);
  assert.match(source, /state\.visited > limits\.values/);
  assert.match(source, /depth > limits\.depth/);
  assert.match(source, /keys\.length > limits\.objectFields/);
  assert.match(source, /snapshotDenseDataArray\(value, label, limits\.arrayEntries\)/);
});

test("M391 rejects hostile JSON shapes rather than truncating or coercing them", () => {
  assert.match(source, /prototype !== Array\.prototype/);
  assert.match(source, /keys\.length !== length \+ 1/);
  assert.match(source, /state\.active\.has\(value\)/);
  assert.match(source, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(source, /typeof key !== "string"/);
  assert.match(source, /!Number\.isFinite\(value\)/);
  assert.match(source, /fields must be enumerable own data fields/);
});

test("M391 shared runtime field reads contain revoked Array.isArray failures", () => {
  assert.match(source, /function ownDataField\(value, key\) \{\s*let isArray;\s*try \{ isArray = Array\.isArray\(value\); \}\s*catch \{ return \{ present: false, safe: false, value: undefined \}; \}/s);
  assert.match(source, /function eventFields\(value, requiredKeys = \[\], optionalKeys = \[\]\) \{\s*let isArray;\s*try \{ isArray = Array\.isArray\(value\); \}\s*catch \{ return null; \}/s);
});
