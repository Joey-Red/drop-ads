import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");
const sandbox = {
  browser: { runtime: { onMessage: { addListener() {} } } },
  DropAdsSelectorUtils: {},
  DropAdsContentMessageContract: {},
  console
};
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "picker.js" });
const lifecycle = sandbox.DropAdsPickerLifecycle;

const element = { nodeType: 1 };
assert.equal(lifecycle.pickerElementTarget(element), element);
assert.equal(lifecycle.pickerElementTarget({ nodeType: 3 }), null);
const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.equal(lifecycle.pickerElementTarget(proxy), null);

const targetTrap = {};
Object.defineProperty(targetTrap, "target", { get() { throw new Error("target trap"); } });
assert.equal(lifecycle.pickerEventTarget(targetTrap), null);
assert.equal(lifecycle.pickerEventTarget({ target: element }), element);

let conversionCalls = 0;
const coerciveKey = {
  toString() { conversionCalls += 1; return "Escape"; },
  valueOf() { conversionCalls += 1; return "Escape"; },
  [Symbol.toPrimitive]() { conversionCalls += 1; return "Escape"; }
};
assert.equal(lifecycle.pickerEventKey({ key: coerciveKey }), null);
assert.equal(conversionCalls, 0);
const keyTrap = {};
Object.defineProperty(keyTrap, "key", { get() { throw new Error("key trap"); } });
assert.equal(lifecycle.pickerEventKey(keyTrap), null);
assert.equal(lifecycle.pickerEventKey({ key: "Escape" }), "Escape");

const hostTrap = {};
Object.defineProperty(hostTrap, "contains", { get() { throw new Error("contains trap"); } });
assert.equal(lifecycle.pickerHostContains(hostTrap, element), false);
assert.equal(lifecycle.pickerHostContains({ contains(value) { return value === element; } }, element), true);

let stopped = 0;
const eventPrototype = {
  preventDefault() { throw new Error("prevent failed"); },
  stopImmediatePropagation() { stopped += 1; }
};
assert.doesNotThrow(() => lifecycle.suppressPickerEvent(Object.create(eventPrototype)));
assert.equal(stopped, 1);

let ownGetterCalls = 0;
const ownAccessorEvent = {};
Object.defineProperty(ownAccessorEvent, "preventDefault", { get() { ownGetterCalls += 1; return () => {}; } });
assert.doesNotThrow(() => lifecycle.suppressPickerEvent(ownAccessorEvent));
assert.equal(ownGetterCalls, 0);

console.log("content picker event target repository coverage present");
