import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "selector-utils.js" });
const helpers = sandbox.DropAdsSelectorUtils;

assert.equal(helpers.cssEscape("plain_name-2"), "plain_name-2");
assert.equal(helpers.cssEscape("1ad"), "\\31 ad");
assert.equal(helpers.cssEscape("-2x"), "-\\32 x");
assert.equal(helpers.cssEscape("."), "\\2e ");
assert.equal(helpers.cssEscape("😀"), "\\1f600 ");
assert.equal(typeof helpers.cssEscape("x".repeat(400)), "string");
assert.throws(() => helpers.cssEscape("x".repeat(401)), /exceeds 400 characters/);

let conversionCalls = 0;
const coercive = {
  toString() { conversionCalls += 1; return "unsafe"; },
  valueOf() { conversionCalls += 1; return "unsafe"; },
  [Symbol.toPrimitive]() { conversionCalls += 1; return "unsafe"; }
};
assert.throws(() => helpers.cssEscape(coercive), /must be a string/);
assert.equal(conversionCalls, 0);

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.throws(() => helpers.cssEscape(proxy), /must be a string/);

console.log("selector css escape direct boundary repository coverage present");
