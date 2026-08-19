import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

function loadLifecycle() {
  const sandbox = {
    browser: { runtime: { onMessage: { addListener() {} } } },
    DropAdsSelectorUtils: {},
    DropAdsContentMessageContract: {},
    setTimeout() { return 1; },
    clearTimeout() {},
    console
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "picker.js" });
  return sandbox.DropAdsPickerLifecycle;
}

const lifecycle = loadLifecycle();

test("picker host connectivity is boolean and trap-contained", () => {
  assert.equal(lifecycle.pickerHostConnected({ isConnected: true }), true);
  assert.equal(lifecycle.pickerHostConnected({ isConnected: false }), false);
  const trapped = {};
  Object.defineProperty(trapped, "isConnected", { get() { throw new Error("trap"); } });
  assert.equal(lifecycle.pickerHostConnected(trapped), false);
  assert.equal(lifecycle.pickerHostConnected(null), false);
});

test("stale active cleanup is best effort", () => {
  let cleaned = 0;
  assert.doesNotThrow(() => lifecycle.bestEffortActiveCleanup({ cleanup() { cleaned += 1; } }));
  assert.equal(cleaned, 1);
  const trapped = {};
  Object.defineProperty(trapped, "cleanup", { get() { throw new Error("trap"); } });
  assert.doesNotThrow(() => lifecycle.bestEffortActiveCleanup(trapped));
  assert.doesNotThrow(() => lifecycle.bestEffortActiveCleanup({ cleanup() { throw new Error("cleanup failed"); } }));
});

test("start keeps connected active picker but clears stale identity before replacement", () => {
  const start = source.indexOf("function startPicker() {");
  const connectedGuard = source.indexOf("if (pickerHostConnected(active.host)) return;", start);
  const staleCapture = source.indexOf("const stale = active;", connectedGuard);
  const activeClear = source.indexOf("active = null;", staleCapture);
  const staleCleanup = source.indexOf("bestEffortActiveCleanup(stale);", activeClear);
  const publish = source.indexOf("active = { sessionId, cleanup, host };", staleCleanup);
  assert.ok(start >= 0);
  assert.ok(connectedGuard > start);
  assert.ok(staleCapture > connectedGuard && activeClear > staleCapture && staleCleanup > activeClear);
  assert.ok(publish > staleCleanup);
});
