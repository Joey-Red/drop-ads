import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

function fakeApi() {
  return {
    runtime: {
      onMessage: {
        addListener() {},
        removeListener() {}
      }
    }
  };
}

test("M457 message guard options use one exact detached snapshot", () => {
  assert.match(source, /exactDataSnapshot\(options, \["group"\], \["rejectUnknown"\], "Message guard options"\)/);
  assert.doesNotMatch(source, /readPlainDataField\(options, "group"\)/);
  assert.doesNotMatch(source, /readPlainDataField\(options, "rejectUnknown"\)/);
});

test("M457 option accessors fail without execution and defaults remain supported", () => {
  let reads = 0;
  const hostile = {};
  Object.defineProperty(hostile, "group", {
    enumerable: true,
    get() {
      reads += 1;
      return "core";
    }
  });
  assert.throws(() => createMessageGuardedApi(fakeApi(), hostile));
  assert.equal(reads, 0);
  assert.doesNotThrow(() => createMessageGuardedApi(fakeApi(), { group: "core" }));
  assert.doesNotThrow(() => createMessageGuardedApi(fakeApi(), { group: "cosmetic", rejectUnknown: false }));
  assert.throws(() => createMessageGuardedApi(fakeApi(), { group: "core", rejectUnknown: 1 }), /must be boolean/);
});
