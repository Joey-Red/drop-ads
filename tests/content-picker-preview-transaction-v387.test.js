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

test("picker focus helper contains lookup and call failure", () => {
  let focused = 0;
  assert.equal(lifecycle.bestEffortPickerFocus({ focus() { focused += 1; } }), true);
  assert.equal(focused, 1);

  const getterTrap = {};
  Object.defineProperty(getterTrap, "focus", { get() { throw new Error("trap"); } });
  assert.equal(lifecycle.bestEffortPickerFocus(getterTrap), false);
  assert.equal(lifecycle.bestEffortPickerFocus({ focus() { throw new Error("call"); } }), false);
});

test("preview commits candidate state only after all required UI publication steps", () => {
  const start = source.indexOf("function choose(element) {");
  const end = source.indexOf("function onMove(event)", start);
  const body = source.slice(start, end);
  const publish = body.indexOf("const previewPublished =");
  const candidateCommit = body.indexOf("candidate = nextCandidate;");
  const selectingCommit = body.indexOf("selecting = false;");
  assert.ok(publish >= 0);
  assert.ok(candidateCommit > publish);
  assert.ok(selectingCommit > candidateCommit);
  assert.match(body, /bestEffortPickerText\(candidateNode, nextCandidate\)/);
  assert.match(body, /bestEffortPickerStyle\(candidateNode, "display", "block"\)/);
  assert.match(body, /bestEffortPickerStyle\(actions, "display", "flex"\)/);
  assert.match(body, /bestEffortPickerText\(message, "Preview selected\./);
  assert.match(body, /bestEffortPickerFocus\(save\)/);
  assert.match(body, /if \(!previewPublished\) throw new Error\("Could not publish picker preview"\);/);
});

test("preview failure rolls visible state back best effort and keeps selection retryable", () => {
  const start = source.indexOf("function choose(element) {");
  const end = source.indexOf("function onMove(event)", start);
  const body = source.slice(start, end);
  assert.match(body, /candidate = null;\s*selecting = true;/s);
  assert.match(body, /bestEffortPickerText\(candidateNode, ""\)/);
  assert.match(body, /bestEffortPickerStyle\(candidateNode, "display", "none"\)/);
  assert.match(body, /bestEffortPickerStyle\(actions, "display", "none"\)/);
  assert.match(body, /contentCaughtErrorMessage\(error, failureText\)/);
  assert.match(body, /bestEffortPickerText\(message, failureText\)/);
});
