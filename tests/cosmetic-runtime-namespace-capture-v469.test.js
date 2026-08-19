import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("M469 cosmetic runtime captures API namespaces and tabs.query before publication", () => {
  assert.match(source, /captureDataValue\(api, "runtime", "Cosmetic runtime runtime namespace"\)/);
  assert.match(source, /captureDataValue\(api, "storage", "Cosmetic runtime storage namespace"\)/);
  assert.match(source, /captureDataValue\(api, "tabs", "Cosmetic runtime tabs namespace"\)/);
  assert.match(source, /captureDataValue\(runtimeNamespace, "onMessage", "Cosmetic runtime message event"\)/);
  assert.match(source, /captureDataValue\(storageNamespace, "onChanged", "Cosmetic storage change event"\)/);
  assert.match(source, /captureEventMethod\(tabsNamespace, "query", "Cosmetic runtime tabs\.query"\)/);
});

test("M469 cosmetic refresh uses only the captured tabs query collaborator", () => {
  assert.match(source, /tabs = await queryTabs\(\{\}\);/);
  assert.doesNotMatch(source, /api\.tabs\.query/);
  assert.match(source, /const existing = INSTALLATIONS\.get\(api\);\s*if \(existing\) return existing;/s);
});
