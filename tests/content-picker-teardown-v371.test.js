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

test("picker listener removal is best effort and trap-contained", () => {
  const listener = () => {};
  let removed = 0;
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveEventListener({
    removeEventListener(type, value, capture) {
      assert.equal(type, "click");
      assert.equal(value, listener);
      assert.equal(capture, true);
      removed += 1;
    }
  }, "click", listener, true));
  assert.equal(removed, 1);

  const getterTrap = {};
  Object.defineProperty(getterTrap, "removeEventListener", { get() { throw new Error("trap"); } });
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveEventListener(getterTrap, "click", listener, true));
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveEventListener({ removeEventListener() { throw new Error("remove failed"); } }, "click", listener, true));
});

test("picker host removal is best effort and trap-contained", () => {
  let removed = 0;
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveNode({ remove() { removed += 1; } }));
  assert.equal(removed, 1);

  const getterTrap = {};
  Object.defineProperty(getterTrap, "remove", { get() { throw new Error("trap"); } });
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveNode(getterTrap));
  assert.doesNotThrow(() => lifecycle.bestEffortRemoveNode({ remove() { throw new Error("remove failed"); } }));
});

test("picker cleanup releases internal session state before collaborator teardown", () => {
  const cleanupStart = source.indexOf("cleanup = function cleanupSession() {");
  const activeClear = source.indexOf("if (active?.sessionId === sessionId) active = null;", cleanupStart);
  const targetClear = source.indexOf("target = null;", cleanupStart);
  const candidateClear = source.indexOf("candidate = null;", cleanupStart);
  const listenerCleanup = source.indexOf("clearPickerListeners(listenerRegistrations);", cleanupStart);
  assert.ok(cleanupStart >= 0);
  assert.ok(activeClear > cleanupStart && activeClear < listenerCleanup);
  assert.ok(targetClear > cleanupStart && targetClear < listenerCleanup);
  assert.ok(candidateClear > cleanupStart && candidateClear < listenerCleanup);
});
