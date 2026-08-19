import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");
const sandbox = { console, URL, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "context-cleanup.js" });
const cleanup = sandbox.DropAdsContextCleanup;

assert.equal(cleanup.cleanupKindForTag("IMG"), "image");
assert.equal(cleanup.cleanupKindForTag("video"), "media");
assert.equal(cleanup.cleanupKindForTag("FRAME"), "frame");
assert.equal(cleanup.cleanupKindForTag("embed"), "object");
assert.equal(cleanup.cleanupKindForTag("AREA"), "link");
assert.equal(cleanup.cleanupKindForTag("div"), "element");
assert.equal(cleanup.cleanupKindForTag(null), "element");
assert.equal(cleanup.cleanupKindForTag(123), "element");

let conversionCalls = 0;
const coercive = {
  toString() { conversionCalls += 1; return "img"; },
  valueOf() { conversionCalls += 1; return "img"; },
  [Symbol.toPrimitive]() { conversionCalls += 1; return "img"; }
};
assert.equal(cleanup.cleanupKindForTag(coercive), "element");
assert.equal(conversionCalls, 0);

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.equal(cleanup.cleanupKindForTag(proxy), "element");

console.log("context cleanup tag classifier repository coverage present");
