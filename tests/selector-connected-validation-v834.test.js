import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

function loadUtils() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.DropAdsSelectorUtils;
}

test("M834 selector validation requires one connected exact target and fails closed", () => {
  const { selectorUniquelyIdentifies } = loadUtils();
  const target = { nodeType: 1, isConnected: true };
  const other = { nodeType: 1, isConnected: true };
  const documentRef = { querySelectorAll() { return [target]; } };
  assert.equal(selectorUniquelyIdentifies("#target", target, documentRef), true);
  assert.equal(selectorUniquelyIdentifies("#target", { nodeType: 1, isConnected: false }, documentRef), false);
  assert.equal(selectorUniquelyIdentifies("#target", target, { querySelectorAll() { return [other]; } }), false);
  assert.equal(selectorUniquelyIdentifies("#target", target, { querySelectorAll() { return [target, other]; } }), false);
  assert.equal(selectorUniquelyIdentifies("[", target, { querySelectorAll() { throw new Error("bad selector"); } }), false);
  assert.equal(selectorUniquelyIdentifies("#target", target, { get querySelectorAll() { throw new Error("hostile"); } }), false);
});
