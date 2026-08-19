import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M852 live session recovery sync is session-scoped and self-mutation safe", () => {
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /areaName !== "session" \|\| !hasSessionStateChange\(changes\)/);
  assert.match(source, /internalMutationDepth > 0/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(changes, SESSION_STORAGE_KEY\)/);
  assert.match(source, /queueRender\(\)/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.doesNotMatch(source, /history\.(?:pushState|replaceState)|localStorage|indexedDB/);
});
