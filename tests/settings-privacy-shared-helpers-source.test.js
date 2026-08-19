import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const audit = fs.readFileSync(new URL("../tools/settings-privacy-surface-audit.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Settings privacy audit covers UI and shared runtime/storage helpers", () => {
  for (const path of [
    "src/options/options.js",
    "src/options/country.js",
    "src/options/cosmetics.js",
    "src/options/action-count.js",
    "src/core/options-runtime.js",
    "src/core/options-storage-listener.js"
  ]) assert.match(audit, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const needle of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon", "webRequest", "declarativeNetRequestFeedback", "indexedDB", "localStorage", "sessionStorage"]) {
    assert.match(audit, new RegExp(needle));
  }
  assert.equal(pkg.scripts["settings-privacy-surface-audit"], "node tools/settings-privacy-surface-audit.mjs");
  assert.match(pkg.scripts.check, /npm run settings-privacy-surface-audit/);
});
