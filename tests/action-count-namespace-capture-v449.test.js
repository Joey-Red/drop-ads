import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/action-count.js", import.meta.url), "utf8");

test("M449 action-count captures browser namespaces through descriptor inspection", () => {
  assert.match(source, /const storage = captureDataProperty\(api, "storage", "Action count storage namespace", false\);/);
  assert.match(source, /captureDataProperty\(storage, "local", "Action count storage\.local namespace", false\)/);
  assert.match(source, /captureDataProperty\(storage, "onChanged", "Action count storage\.onChanged event", false\)/);
  assert.match(source, /captureDataProperty\(api, "declarativeNetRequest", "Action count declarativeNetRequest namespace", false\)/);
  assert.doesNotMatch(source, /api\?\.storage/);
  assert.doesNotMatch(source, /api\?\.declarativeNetRequest/);
});
