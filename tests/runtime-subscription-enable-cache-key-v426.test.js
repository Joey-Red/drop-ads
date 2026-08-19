import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

function functionBlock(name, nextName) {
  const start = source.indexOf(`  async function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = source.indexOf(`\n  async function ${nextName}`, start);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return source.slice(start, end);
}

test("M426 uncached subscription enable stores fetched policy under the validated requested id", () => {
  const block = functionBlock("setSubscriptionEnabled", "removeExternalSubscription");
  assert.match(block, /const parsed = await downloadAndParseSubscription\(initial, fetchImpl\);/);
  assert.match(block, /preparedEntry = makeCacheEntry\(parsed, now\(\), initialState\.updateIntervalHours \* 60 \* 60 \* 1000\);/);
  assert.match(block, /candidateCache\[id\] = preparedEntry;/);
  assert.match(block, /preparedSource = "fetched";/);
  assert.match(block, /await commitSubscriptionMutation\(candidateState, candidateCache, "subscription enable\/disable"\);/);
  assert.doesNotMatch(block, /candidateCache\[candidate\.id\]/);
});
