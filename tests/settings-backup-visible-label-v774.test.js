import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("backup action group uses visible heading and both help paragraphs", () => {
  assert.match(source, /removeAttribute\("aria-label"\)/);
  assert.match(source, /setAttribute\("aria-labelledby", "backup-heading"\)/);
  assert.match(source, /"backup-overview"/);
  assert.match(source, /"backup-import-help"/);
});
