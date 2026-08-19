import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "selector-utils.js" });
const helpers = sandbox.DropAdsSelectorUtils;

function div(className = "card") {
  return {
    nodeType: 1,
    localName: "div",
    id: "",
    classList: [className],
    getAttribute() { return null; },
    parentElement: null
  };
}

const picked = div();
const other = div();
const fakeSibling = { localName: "div" };
const parent = {
  nodeType: 1,
  localName: "section",
  id: "",
  classList: [],
  getAttribute() { return null; },
  parentElement: null,
  children: [fakeSibling, picked, other]
};
picked.parentElement = parent;
other.parentElement = parent;

const documentRef = {
  querySelectorAll(selector) {
    if (selector === "div.card") return [picked, other];
    if (selector === "div.card:nth-of-type(1)") return [picked];
    return [];
  }
};
assert.equal(helpers.generateStableSelector(picked, documentRef), "div.card:nth-of-type(1)");

const fakeParent = { children: [picked] };
picked.parentElement = fakeParent;
const noUniqueDocument = { querySelectorAll() { return [picked, other]; } };
assert.throws(
  () => helpers.generateStableSelector(picked, noUniqueDocument),
  /Could not generate a stable unique selector/
);

console.log("selector real-element sibling repository coverage present");
