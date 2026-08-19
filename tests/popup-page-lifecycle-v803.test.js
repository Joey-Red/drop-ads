import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup owns async lifecycle before top-level awaits", () => {
  const pagehide = source.indexOf('window.addEventListener("pagehide"');
  const initialAwait = source.indexOf("initialSnapshot = await getSnapshot()");
  assert.ok(pagehide >= 0 && initialAwait > pagehide);
  assert.match(source, /let pageActive = true;/);
  assert.match(source, /pageActive = false;[\s\S]*renderQueued = false;[\s\S]*committedRenderGeneration \+= 1;/);
  assert.match(source, /try \{ disposeStorageLiveSync\?\.\(\); \} catch/);
  assert.match(source, /if \(pageActive\) \{[\s\S]*renderGlobal\(initialSnapshot\)/);
  assert.match(source, /const tab = snapshotPopupActiveTab\(await queryPopupActiveTab\(api\)\);[\s\S]*if \(pageActive\)/);
});
