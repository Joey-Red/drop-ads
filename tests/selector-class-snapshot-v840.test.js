import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");
function loadUtils() { const sandbox = {}; sandbox.globalThis = sandbox; vm.runInNewContext(source, sandbox); return sandbox.DropAdsSelectorUtils; }

test("picker rejects a torn classList snapshot", () => {
  const { generateStableSelector } = loadUtils();
  const first = ["stable-page-class"];
  const second = ["changed-page-class"];
  let reads = 0;
  const element = {
    nodeType: 1,
    isConnected: true,
    localName: "div",
    id: "",
    get classList() { reads += 1; return reads === 1 ? first : second; },
    getAttribute() { return null; },
    parentElement: null
  };
  const documentRef = { querySelectorAll() { return []; } };
  assert.throws(() => generateStableSelector(element, documentRef), /stable unique selector/);
});
