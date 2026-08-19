import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function streamedResponse(results, onCancel = () => {}) {
  let index = 0;
  return {
    headers: { get() { return null; } },
    body: {
      getReader() {
        return {
          async read() { return results[index++] ?? { done: true }; },
          async cancel() { onCancel(); }
        };
      }
    }
  };
}

test("revoked Proxy byte chunks fail closed and cancel the reader", async () => {
  const pair = Proxy.revocable(new Uint8Array([65]), {});
  pair.revoke();
  let cancels = 0;
  const response = streamedResponse([{ done: false, value: pair.proxy }], () => { cancels += 1; });
  await assert.rejects(readResponseTextBounded(response), /invalid byte chunk/);
  assert.equal(cancels, 1);
});

test("legitimate Uint8Array subclasses remain readable", async () => {
  class Bytes extends Uint8Array {}
  const response = streamedResponse([
    { done: false, value: new Bytes([65, 66]) },
    { done: true }
  ]);
  assert.equal(await readResponseTextBounded(response), "AB");
});
