import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("guarded runtime forwarding preserves receiver without callable-owned bind", () => {
  const proxyAt = source.indexOf("const guardedRuntime = new Proxy(rawRuntime");
  assert.ok(proxyAt >= 0);
  const tail = source.slice(proxyAt);
  assert.match(tail, /typeof value === "function" \? \(\.\.\.args\) => Reflect\.apply\(value, target, args\) : value/);
  assert.doesNotMatch(tail, /value\.bind\(target\)/);
});

test("guarded runtime still substitutes onMessage and forwards non-functions", () => {
  const proxyAt = source.indexOf("const guardedRuntime = new Proxy(rawRuntime");
  const tail = source.slice(proxyAt);
  assert.match(tail, /if \(property === "onMessage"\) return guardedOnMessage;/);
  assert.match(tail, /const value = Reflect\.get\(target, property, receiver\);/);
});
