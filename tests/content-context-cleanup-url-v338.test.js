import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");
const sandbox = { console, URL, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "context-cleanup.js" });
const cleanup = sandbox.DropAdsContextCleanup;

assert.equal(cleanup.normalizeComparableUrl("/asset.png#frag", "https://example.com/base/"), "https://example.com/asset.png");
assert.equal(cleanup.normalizeComparableUrl("https://example.com/a?b=1#frag", "https://base.example/"), "https://example.com/a?b=1");
assert.equal(cleanup.normalizeComparableUrl("javascript:alert(1)", "https://example.com/"), null);
assert.equal(cleanup.normalizeComparableUrl("x".repeat(16_385), "https://example.com/"), null);
assert.equal(cleanup.normalizeComparableUrl("/asset.png", "x".repeat(16_385)), null);

let conversionCalls = 0;
const coercive = {
  toString() { conversionCalls += 1; return "https://example.com/"; },
  valueOf() { conversionCalls += 1; return "https://example.com/"; },
  [Symbol.toPrimitive]() { conversionCalls += 1; return "https://example.com/"; }
};
assert.equal(cleanup.normalizeComparableUrl(coercive, "https://example.com/"), null);
assert.equal(cleanup.normalizeComparableUrl("/asset.png", coercive), null);
assert.equal(conversionCalls, 0);

const first = Proxy.revocable({}, {});
first.revoke();
assert.equal(cleanup.normalizeComparableUrl(first.proxy, "https://example.com/"), null);
const second = Proxy.revocable({}, {});
second.revoke();
assert.equal(cleanup.normalizeComparableUrl("/asset.png", second.proxy), null);

console.log("context cleanup comparable URL boundary repository coverage present");
