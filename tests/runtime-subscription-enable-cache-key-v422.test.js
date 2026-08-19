import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M422 uncached subscription enable stores the fetched entry under the validated requested id", () => {
  const start = source.indexOf("async function setSubscriptionEnabled");
  const end = source.indexOf("async function removeExternalSubscription", start);
  assert.ok(start >= 0 && end > start, "setSubscriptionEnabled source block is present");
  const block = source.slice(start, end);
  assert.match(block, /preparedEntry = makeCacheEntry\(parsed,/);
  assert.match(block, /candidateCache\[id\] = preparedEntry;/);
  assert.doesNotMatch(block, /candidateCache\[candidate\.id\]/);
});
