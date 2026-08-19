import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "selector-utils.js" });
const helpers = sandbox.DropAdsSelectorUtils;

function element(id = "picked") {
  return {
    nodeType: 1,
    localName: "div",
    id,
    classList: [],
    getAttribute() { return null; },
    parentElement: null
  };
}

const picked = element();
const other = element();

const correctDocument = {
  querySelectorAll(selector) {
    assert.equal(selector, "#picked");
    return [picked];
  }
};
assert.equal(helpers.generateStableSelector(picked, correctDocument), "#picked");

const wrongSingleMatch = {
  querySelectorAll() { return [other]; }
};
assert.throws(
  () => helpers.generateStableSelector(picked, wrongSingleMatch),
  /Could not generate a stable unique selector/
);

let entryGetterCalls = 0;
const trappedResult = [];
Object.defineProperty(trappedResult, "0", {
  configurable: true,
  enumerable: true,
  get() { entryGetterCalls += 1; throw new Error("entry trap"); }
});
trappedResult.length = 1;
const trappedDocument = { querySelectorAll() { return trappedResult; } };
assert.throws(
  () => helpers.generateStableSelector(picked, trappedDocument),
  /Could not generate a stable unique selector/
);
assert.equal(entryGetterCalls, 1);

console.log("selector target identity repository coverage present");
