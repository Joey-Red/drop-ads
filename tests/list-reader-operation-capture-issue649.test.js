import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function syntheticResponse(reader) {
  return {
    ok: true,
    redirected: false,
    status: 200,
    body: { getReader: () => reader },
    headers: { get: () => null }
  };
}

test("streamed reads use the captured reader read operation after mutation", async () => {
  let reads = 0;
  const reader = {
    read() {
      reads += 1;
      if (reads === 1) {
        reader.read = () => { throw new Error("replacement read must not run"); };
        return Promise.resolve({ done: false, value: new Uint8Array([111, 107]) });
      }
      return Promise.resolve({ done: true });
    },
    cancel() { return Promise.resolve(); }
  };

  assert.equal(await readResponseTextBounded(syntheticResponse(reader), 16), "ok");
  assert.equal(reads, 2);
});

test("oversize cleanup uses the captured reader cancel operation after mutation", async () => {
  let cancels = 0;
  const reader = {
    read() {
      reader.cancel = () => { throw new Error("replacement cancel must not run"); };
      return Promise.resolve({ done: false, value: new Uint8Array([111, 107]) });
    },
    cancel() {
      cancels += 1;
      return Promise.resolve();
    }
  };

  await assert.rejects(readResponseTextBounded(syntheticResponse(reader), 1), /too large/);
  assert.equal(cancels >= 1, true);
});
