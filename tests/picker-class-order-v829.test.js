import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

function loadUtils() {
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "selector-utils.js" });
  return sandbox.DropAdsSelectorUtils;
}

function elementWithClasses(classes) {
  return {
    nodeType: 1,
    isConnected: true,
    localName: "div",
    id: "",
    classList: [...classes],
    getAttribute() { return null; },
    parentElement: null
  };
}

test("picker class fallback is deterministic across class-list order", () => {
  const { generateStableSelector } = loadUtils();
  const first = elementWithClasses(["zeta", "alpha", "beta", "alpha", "omega"]);
  const second = elementWithClasses(["omega", "beta", "zeta", "alpha"]);
  const expected = "div.alpha.beta.omega";

  const firstDocument = { querySelectorAll(selector) { return selector === expected ? [first] : []; } };
  const secondDocument = { querySelectorAll(selector) { return selector === expected ? [second] : []; } };

  assert.equal(generateStableSelector(first, firstDocument), expected);
  assert.equal(generateStableSelector(second, secondDocument), expected);
});

test("picker class fallback fails closed on oversized class-list work", () => {
  const { generateStableSelector } = loadUtils();
  const element = elementWithClasses(Array.from({ length: 65 }, (_, index) => `c${index}`));
  const documentRef = { querySelectorAll() { return []; } };
  assert.throws(() => generateStableSelector(element, documentRef), /stable unique selector/);
});
