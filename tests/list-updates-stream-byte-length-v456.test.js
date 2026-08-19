import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

function syntheticResponse(chunk) {
  let delivered = false;
  const reader = {
    read() {
      if (delivered) return Promise.resolve({ done: true });
      delivered = true;
      return Promise.resolve({ done: false, value: chunk });
    },
    cancel() { return Promise.resolve(); }
  };
  return {
    body: { getReader() { return reader; } },
    text() { throw new Error("stream path expected"); }
  };
}

test("M456 streamed byte accounting uses the intrinsic typed-array getter", async () => {
  let poisonedReads = 0;
  class PoisonedLengthChunk extends Uint8Array {
    get byteLength() {
      poisonedReads += 1;
      throw new Error("poisoned byteLength getter executed");
    }
  }
  const chunk = new PoisonedLengthChunk([0x61, 0x62, 0x63]);
  assert.equal(await readResponseTextBounded(syntheticResponse(chunk), 3), "abc");
  assert.equal(poisonedReads, 0);
  assert.match(source, /Reflect\.apply\(descriptor\.get, value, \[\]\)/);
  assert.match(source, /byteLength \+= intrinsicUint8ArrayByteLength\(chunk\)/);
  assert.doesNotMatch(source, /byteLength \+= chunk\.byteLength/);
});

test("M456 one-over byte accounting still cancels before accepting the body", async () => {
  let cancelled = 0;
  const chunk = new Uint8Array([0x61, 0x62]);
  let delivered = false;
  const response = {
    body: {
      getReader() {
        return {
          read() {
            if (delivered) return Promise.resolve({ done: true });
            delivered = true;
            return Promise.resolve({ done: false, value: chunk });
          },
          cancel() { cancelled += 1; return Promise.resolve(); }
        };
      }
    },
    text() { throw new Error("stream path expected"); }
  };
  await assert.rejects(() => readResponseTextBounded(response, 1), /Remote list is too large/);
  assert.equal(cancelled, 1);
});
