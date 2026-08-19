import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M459 guarded runtime forwarding avoids callback-owned bind", () => {
  assert.doesNotMatch(source, /value\.bind\(target\)/);
  assert.match(source, /\(\.\.\.args\) => Reflect\.apply\(value, target, args\)/);
});

test("M459 forwarded runtime functions preserve receiver without reading custom bind property", () => {
  const runtime = {
    marker: "runtime",
    onMessage: {
      addListener() {},
      removeListener() {}
    }
  };
  function getURL(path) {
    assert.equal(this, runtime);
    return `${this.marker}:${path}`;
  }
  let bindReads = 0;
  Object.defineProperty(getURL, "bind", {
    configurable: true,
    get() {
      bindReads += 1;
      throw new Error("bind should not be read");
    }
  });
  runtime.getURL = getURL;
  const guarded = createMessageGuardedApi({ runtime }, { group: "core" });
  assert.equal(guarded.runtime.getURL("asset"), "runtime:asset");
  assert.equal(bindReads, 0);
});
