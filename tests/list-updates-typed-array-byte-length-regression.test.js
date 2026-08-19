import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

class ShadowLengthChunk extends Uint8Array {
  get byteLength() {
    throw new Error("shadow byteLength getter must not run");
  }
}

test("streamed Uint8Array subclasses use intrinsic byte length", async () => {
  let reads = 0;
  const chunk = new ShadowLengthChunk([0x6f, 0x6b]);
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

  assert.equal(await readResponseTextBounded(response, 16), "ok");
});
