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

test("picker style writer contains style lookup and assignment traps", () => {
  const node = { style: {} };
  assert.equal(lifecycle.bestEffortPickerStyle(node, "display", "block"), true);
  assert.equal(node.style.display, "block");

  const styleTrap = {};
  Object.defineProperty(styleTrap, "style", { get() { throw new Error("trap"); } });
  assert.equal(lifecycle.bestEffortPickerStyle(styleTrap, "display", "none"), false);

  const assignmentTrap = { style: new Proxy({}, { set() { throw new Error("trap"); } }) };
  assert.equal(lifecycle.bestEffortPickerStyle(assignmentTrap, "left", "1px"), false);
});

test("highlight positioning uses only the best-effort style writer", () => {
  const start = source.indexOf("function positionBox(element) {");
  const end = source.indexOf("function setTarget(element) {", start);
  const body = source.slice(start, end);
  assert.match(body, /bestEffortPickerStyle\(box, "display", "none"\)/);
  assert.match(body, /bestEffortPickerStyle\(box, "display", "block"\)/);
  assert.match(body, /bestEffortPickerStyle\(box, "left"/);
  assert.match(body, /bestEffortPickerStyle\(box, "top"/);
  assert.match(body, /bestEffortPickerStyle\(box, "width"/);
  assert.match(body, /bestEffortPickerStyle\(box, "height"/);
  assert.doesNotMatch(body, /box\.style\./);
});
