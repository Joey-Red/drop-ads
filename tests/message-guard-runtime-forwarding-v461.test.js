import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

function listenerEvent() {
  return {
    addListener() {},
    removeListener() {}
  };
}

test("M461 guarded runtime forwarding invokes function values through Reflect.apply", () => {
  assert.match(source, /typeof value === "function" \? \(\.\.\.args\) => Reflect\.apply\(value, target, args\) : value/);
  assert.doesNotMatch(source, /value\.bind\(target\)/);
});

test("M461 forwarded runtime methods never consult a callable-owned bind property", () => {
  let bindReads = 0;
  const method = function (increment) { return this.marker + increment; };
  Object.defineProperty(method, "bind", {
    configurable: true,
    get() { bindReads += 1; throw new Error("poisoned bind"); }
  });
  const runtime = { onMessage: listenerEvent(), marker: 7, method };
  const guarded = createMessageGuardedApi({ runtime }, { group: "core" });

  assert.equal(guarded.runtime.method(5), 12);
  assert.equal(bindReads, 0);
  assert.equal(guarded.runtime.marker, 7);
});
