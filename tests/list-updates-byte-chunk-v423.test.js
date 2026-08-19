import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function revokedUint8ArrayProxy() {
  const { proxy, revoke } = Proxy.revocable(new Uint8Array([65]), {});
  revoke();
  return proxy;
}

test("M423 revoked/proxied stream chunks fail through the reviewed byte-chunk boundary", async () => {
  let cancelled = 0;
  const reader = {
    async read() {
      return { done: false, value: revokedUint8ArrayProxy() };
    },
    async cancel() {
      cancelled += 1;
    }
  };
  const response = {
    body: { getReader() { return reader; } },
    async text() { throw new Error("stream path expected"); }
  };

  await assert.rejects(
    readResponseTextBounded(response, 16),
    /Remote list body returned an invalid byte chunk/
  );
  assert.equal(cancelled, 1);
});

test("M423 actual Uint8Array chunks retain normal streamed decoding", async () => {
  const chunks = [
    { done: false, value: new Uint8Array([65, 66]) },
    { done: true }
  ];
  const reader = {
    async read() { return chunks.shift(); },
    async cancel() { throw new Error("valid stream must not be cancelled"); }
  };
  const response = { body: { getReader() { return reader; } } };

  assert.equal(await readResponseTextBounded(response, 16), "AB");
});
