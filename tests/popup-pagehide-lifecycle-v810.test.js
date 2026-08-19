import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup owns teardown before async initialization", () => {
  assert.match(source, /let pageActive = true;/);
  assert.match(source, /window\.addEventListener\("pagehide", \(\) => \{\n  pageActive = false;\n  renderQueued = false;\n  committedRenderGeneration \+= 1;\n  globalStatusRevision \+= 1;\n  siteStatusRevision \+= 1;\n  pendingMutations = 0;/);
  assert.match(source, /try \{ disposeStorageLiveSync\?\.\(\); \} catch/);
  assert.ok(source.indexOf('window.addEventListener("pagehide"') < source.indexOf("initialSnapshot = await getSnapshot()"));
});
