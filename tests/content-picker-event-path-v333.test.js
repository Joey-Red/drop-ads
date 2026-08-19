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
const host = {};

const eventPrototype = {
  composedPath() { return [{}, host, {}]; }
};
assert.equal(lifecycle.ownedByPicker(Object.create(eventPrototype), host), true);
assert.equal(lifecycle.ownedByPicker(Object.create(eventPrototype), {}), false);

let getterCalls = 0;
const accessorEvent = Object.create(eventPrototype);
Object.defineProperty(accessorEvent, "composedPath", {
  configurable: true,
  get() { getterCalls += 1; return () => [host]; }
});
assert.equal(lifecycle.ownedByPicker(accessorEvent, host), false);
assert.equal(getterCalls, 0);

const throwingEvent = Object.create({ composedPath() { throw new Error("boom"); } });
assert.equal(lifecycle.ownedByPicker(throwingEvent, host), false);

const sparseEvent = Object.create({ composedPath() { const value = []; value.length = 2; value[1] = host; return value; } });
assert.equal(lifecycle.ownedByPicker(sparseEvent, host), false);

let pathGetterCalls = 0;
const accessorPathEvent = Object.create({
  composedPath() {
    const value = [null];
    Object.defineProperty(value, "0", { configurable: true, enumerable: true, get() { pathGetterCalls += 1; return host; } });
    return value;
  }
});
assert.equal(lifecycle.ownedByPicker(accessorPathEvent, host), false);
assert.equal(pathGetterCalls, 0);

const oversizedEvent = Object.create({ composedPath() { return Array.from({ length: lifecycle.MAX_PICKER_EVENT_PATH_ENTRIES + 1 }, () => null); } });
assert.equal(lifecycle.ownedByPicker(oversizedEvent, host), false);

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.equal(lifecycle.ownedByPicker(proxy, host), false);

console.log("content picker composed path boundary repository coverage present");
