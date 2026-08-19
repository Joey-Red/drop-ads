import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("uncached subscription enable stores the fetched entry under the validated requested id", () => {
  const match = source.match(/async function setSubscriptionEnabled\(id, enabled\) \{([\s\S]*?)\n  \}\n\n  async function removeExternalSubscription/);
  assert.ok(match, "setSubscriptionEnabled implementation should be present");
  const body = match[1];
  assert.match(body, /preparedEntry = makeCacheEntry\(/);
  assert.match(body, /if \(enabled && !candidateCache\[id\]\) \{[\s\S]*?candidateCache\[id\] = preparedEntry;/);
  assert.doesNotMatch(body, /candidateCache\[candidate\.id\]/);
  assert.match(body, /preparedSource = "fetched"/);
});
