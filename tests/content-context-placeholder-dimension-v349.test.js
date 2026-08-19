import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");
const sandbox = { console, URL, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "context-cleanup.js" });
const cleanup = sandbox.DropAdsContextCleanup;

function placeholderDocument() {
  return {
    activeElement: null,
    createElement(tag) {
      assert.equal(tag, "span");
      return {
        attributes: new Map(),
        style: {},
        setAttribute(name, value) { this.attributes.set(name, value); }
      };
    }
  };
}

let coercions = 0;
const coerciveWidth = {
  valueOf() { coercions += 1; return 100; },
  toString() { coercions += 1; return "100"; },
  [Symbol.toPrimitive]() { coercions += 1; return 100; }
};
let replacement = null;
const element = {
  nodeType: 1,
  isConnected: true,
  localName: "img",
  ownerDocument: placeholderDocument(),
  getBoundingClientRect() { return { width: coerciveWidth, height: 20.2 }; },
  replaceWith(value) { replacement = value; }
};
const result = cleanup.cleanupElement(element);
assert.equal(result.cleaned, true);
assert.equal(result.placeholder, true);
assert.equal(coercions, 0);
assert.equal(replacement.style.width, undefined);
assert.equal(replacement.style.height, "21px");

replacement = null;
const capped = {
  ...element,
  getBoundingClientRect() { return { width: 5000.1, height: 0.9 }; },
  replaceWith(value) { replacement = value; }
};
assert.equal(cleanup.cleanupElement(capped).cleaned, true);
assert.equal(replacement.style.width, "4096px");
assert.equal(replacement.style.height, undefined);

replacement = null;
const trappedRect = {};
Object.defineProperty(trappedRect, "width", { get() { throw new Error("width trap"); } });
Object.defineProperty(trappedRect, "height", { value: 15.1 });
const trapped = {
  ...element,
  getBoundingClientRect() { return trappedRect; },
  replaceWith(value) { replacement = value; }
};
assert.doesNotThrow(() => cleanup.cleanupElement(trapped));
assert.equal(replacement.style.width, undefined);
assert.equal(replacement.style.height, "16px");

console.log("context placeholder dimension non-coercive boundary repository coverage present");
