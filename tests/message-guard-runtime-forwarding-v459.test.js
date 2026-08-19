import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function event() {
  return {
    addListener() {},
    removeListener() {}
  };
}

test("M459 forwarded runtime methods preserve receiver without reading callable-owned bind", () => {
  const runtime = {
    onMessage: event()
  };
  let bindReads = 0;
  function getURL(path) {
    assert.equal(this, runtime);
    return `moz-extension://fixture/${path}`;
  }
  Object.defineProperty(getURL, "bind", {
    configurable: true,
    get() {
      bindReads += 1;
      throw new Error("callback-owned bind was read");
    }
  });
  runtime.getURL = getURL;
  const api = { runtime };

  const guarded = createMessageGuardedApi(api, { group: "core" });
  assert.equal(guarded.runtime.getURL("asset.txt"), "moz-extension://fixture/asset.txt");
  assert.equal(bindReads, 0);
});
