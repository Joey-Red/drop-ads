import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseFromResults(results, onCancel = () => {}) {
  let index = 0;
  return {
    body: {
      getReader() {
        return {
          async read() { return results[index++]; },
          async cancel() { onCancel(); }
        };
      }
    }
  };
}

test("M423 revoked Proxy byte chunks fail through the reviewed reader boundary and cancel best effort", async () => {
  const pair = Proxy.revocable(new Uint8Array([65]), {});
  pair.revoke();
  let cancels = 0;
  const response = responseFromResults([{ done: false, value: pair.proxy }], () => { cancels += 1; });

  await assert.rejects(
    readResponseTextBounded(response, 32, { headersGet: () => null }),
    /invalid byte chunk/
  );
  assert.equal(cancels, 1);
});

test("M423 legitimate Uint8Array subclasses remain readable", async () => {
  class ByteSubclass extends Uint8Array {}
  const response = responseFromResults([
    { done: false, value: new ByteSubclass([65]) },
    { done: true }
  ]);

  assert.equal(await readResponseTextBounded(response, 32, { headersGet: () => null }), "A");
});
