import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");
const sandbox = { console, URL, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: "context-cleanup.js" });
const cleanup = sandbox.DropAdsContextCleanup;

assert.equal(cleanup.elementUrl({
  nodeType: 1,
  localName: "IMG",
  currentSrc: "https://example.com/ad.png#fragment",
  src: "https://example.com/fallback.png"
}), "https://example.com/ad.png");
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: "iframe", src: "https://example.com/frame" }), "https://example.com/frame");
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: "object", data: "https://example.com/object" }), "https://example.com/object");
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: "a", href: "https://example.com/link" }), "https://example.com/link");

let conversionCalls = 0;
const coercive = {
  toString() { conversionCalls += 1; return "img"; },
  valueOf() { conversionCalls += 1; return "img"; },
  [Symbol.toPrimitive]() { conversionCalls += 1; return "img"; }
};
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: coercive, src: "https://example.com/ad.png" }), null);
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: "img", currentSrc: coercive, src: "https://example.com/ad.png" }), null);
assert.equal(conversionCalls, 0);

const throwing = { nodeType: 1, localName: "img" };
Object.defineProperty(throwing, "currentSrc", { get() { throw new Error("resource trap"); } });
assert.equal(cleanup.elementUrl(throwing), null);

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.equal(cleanup.elementUrl(proxy), null);
assert.equal(cleanup.elementUrl({ nodeType: 1, localName: "div", src: "https://example.com/nope" }), null);

console.log("context element URL non-coercive repository coverage present");
