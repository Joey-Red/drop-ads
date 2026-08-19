import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner candidate selection snapshots exact dense data", () => {
  assert.match(source, /function snapshotCandidate\(candidate\)/);
  assert.match(source, /Object\.getPrototypeOf\(candidate\)/);
  assert.match(source, /Reflect\.ownKeys\(candidate\)/);
  assert.match(source, /keys\.length !== 3/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(candidate, key\)/);
  assert.match(source, /descriptor\?\.enumerable/);
  assert.match(source, /function snapshotCandidateArray\(candidates\)/);
  assert.match(source, /prototype !== Array\.prototype/);
  assert.match(source, /ownKeys\.length !== length \+ 1/);
  assert.match(source, /Object\.freeze\(\{ element: values\.element, text: values\.text, consentRoot: values\.consentRoot \}\)/);
  assert.doesNotMatch(source, /candidate\?\.text/);
});
