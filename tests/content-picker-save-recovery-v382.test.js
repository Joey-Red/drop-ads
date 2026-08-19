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

test("picker text and disabled writes are best effort", () => {
  const textNode = {};
  Object.defineProperty(textNode, "textContent", { set() { throw new Error("text trap"); } });
  const control = {};
  Object.defineProperty(control, "disabled", { set() { throw new Error("disabled trap"); } });
  assert.equal(lifecycle.bestEffortPickerText(textNode, "status"), false);
  assert.equal(lifecycle.bestEffortPickerDisabled(control, true), false);
  assert.equal(lifecycle.bestEffortPickerText({}, 1), false);
  assert.equal(lifecycle.bestEffortPickerDisabled({}, "true"), false);
});

test("save UI setup and recovery are inside the contained async operation", () => {
  const handler = source.indexOf('save.addEventListener("click", async () => {');
  const tryStart = source.indexOf("try {", handler);
  const disableStart = source.indexOf("bestEffortPickerDisabled(save, true);", handler);
  const fallback = source.indexOf('let failureText = "Could not save cosmetic rule";', handler);
  const formatter = source.indexOf("messageContract.contentCaughtErrorMessage", fallback);
  const statusRecovery = source.indexOf("bestEffortPickerText(message, failureText);", formatter);
  const saveRecovery = source.indexOf("bestEffortPickerDisabled(save, false);", statusRecovery);
  const cancelRecovery = source.indexOf("bestEffortPickerDisabled(cancel, false);", saveRecovery);
  assert.ok(handler >= 0);
  assert.ok(tryStart > handler && tryStart < disableStart);
  assert.ok(fallback > disableStart && formatter > fallback);
  assert.ok(statusRecovery > formatter && saveRecovery > statusRecovery && cancelRecovery > saveRecovery);
});
