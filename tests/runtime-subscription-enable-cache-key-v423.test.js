import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

function subscriptionEnableBody() {
  const start = source.indexOf("async function setSubscriptionEnabled(id, enabled)");
  const end = source.indexOf("async function removeExternalSubscription", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

test("M423 freshly fetched subscription cache uses the validated requested id", () => {
  const body = subscriptionEnableBody();
  assert.match(body, /preparedEntry = makeCacheEntry\(parsed, now\(\), initialState\.updateIntervalHours \* 60 \* 60 \* 1000\);/);
  assert.match(body, /candidateCache\[id\] = preparedEntry;/);
  assert.doesNotMatch(body, /candidateCache\[candidate\.id\]/);
  assert.match(body, /preparedSource = "fetched";/);
});
