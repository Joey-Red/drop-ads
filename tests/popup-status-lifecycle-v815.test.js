import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup status publication is lifecycle guarded", () => {
  assert.match(source, /function publishGlobalStatus\(text\) \{\n  globalStatusRevision \+= 1;\n  if \(pageActive\) globalStatus\.textContent = text;/);
  assert.match(source, /function clearGlobalStatus[\s\S]*if \(!pageActive\) return;/);
  assert.match(source, /function publishSiteStatus\(text\) \{\n  siteStatusRevision \+= 1;\n  if \(pageActive\) sessionStatus\.textContent = text;/);
  assert.match(source, /function publishCommittedSiteStatus\(text, revision\) \{\n  if \(!pageActive \|\| revision !== siteStatusRevision\) return false;/);
  assert.match(source, /globalStatusRevision \+= 1;\n  siteStatusRevision \+= 1;/);
});
