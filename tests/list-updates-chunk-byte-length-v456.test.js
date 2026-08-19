import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

test("M456 streamed chunk byte accounting does not read a shadowed byteLength property", async () => {
  let shadowGetterCalls = 0;
  class ShadowedChunk extends Uint8Array {}
  const chunk = new ShadowedChunk([0x61]);
  Object.defineProperty(chunk, "byteLength", {
    configurable: true,
    get() {
      shadowGetterCalls += 1;
      throw new Error("ordinary byteLength access is forbidden");
    }
  });

  let reads = 0;
  const reader = {
    read() {
      reads += 1;
      return reads === 1
        ? Promise.resolve({ done: false, value: chunk })
        : Promise.resolve({ done: true });
    },
    cancel() {}
  };
  const response = {
    body: { getReader() { return reader; } },
    text() { throw new Error("stream path expected"); }
  };

  assert.equal(await readResponseTextBounded(response, 16), "a");
  assert.equal(shadowGetterCalls, 0);
});

test("M456 proxy-wrapped byte chunks still fail closed", async () => {
  const chunk = new Proxy(new Uint8Array([0x61]), {});
  let reads = 0;
  const response = {
    body: {
      getReader() {
        return {
          read() {
            reads += 1;
            return reads === 1
              ? Promise.resolve({ done: false, value: chunk })
              : Promise.resolve({ done: true });
          },
          cancel() {}
        };
      }
    },
    text() { throw new Error("stream path expected"); }
  };

  await assert.rejects(readResponseTextBounded(response, 16), /invalid byte chunk/);
});
