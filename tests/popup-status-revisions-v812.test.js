import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup status publication is revision and lifecycle guarded", () => {
  assert.match(source, /let globalStatusRevision = 0;/);
  assert.match(source, /let siteStatusRevision = 0;/);
  assert.match(source, /if \(revision != null && revision !== globalStatusRevision\) return;/);
  assert.match(source, /if \(!pageActive \|\| revision !== siteStatusRevision\) return false;/);
  assert.match(source, /globalStatusRevision \+= 1;\n  siteStatusRevision \+= 1;/);
});
