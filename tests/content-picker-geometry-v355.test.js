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

const valid = {
  isConnected: true,
  getBoundingClientRect() { return { left: -5, top: 8, width: 120.5, height: 40 }; }
};
assert.deepEqual(
  { ...lifecycle.pickerRectSnapshot(valid) },
  { left: -5, top: 8, width: 120.5, height: 40 }
);

assert.equal(lifecycle.pickerRectSnapshot({ isConnected: false }), null);
assert.equal(lifecycle.pickerRectSnapshot({
  get isConnected() { throw new Error("connected trap"); }
}), null);
assert.equal(lifecycle.pickerRectSnapshot({
  isConnected: true,
  get getBoundingClientRect() { throw new Error("rect method trap"); }
}), null);
assert.equal(lifecycle.pickerRectSnapshot({
  isConnected: true,
  getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 1 }; }
}), null);
assert.equal(lifecycle.pickerRectSnapshot({
  isConnected: true,
  getBoundingClientRect() { return { left: 0, top: 0, width: Infinity, height: 1 }; }
}), null);

let conversions = 0;
const coercive = {
  valueOf() { conversions += 1; return 1; },
  toString() { conversions += 1; return "1"; }
};
assert.equal(lifecycle.pickerRectSnapshot({
  isConnected: true,
  getBoundingClientRect() { return { left: coercive, top: 0, width: 1, height: 1 }; }
}), null);
assert.equal(conversions, 0);

assert.equal(lifecycle.pickerRectSnapshot({
  isConnected: true,
  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      get width() { throw new Error("width trap"); },
      height: 1
    };
  }
}), null);

console.log("picker geometry boundary repository coverage present");
