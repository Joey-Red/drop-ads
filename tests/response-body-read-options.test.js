import assert from "node:assert/strict";
import test from "node:test";

import { MAX_REMOTE_LIST_BYTES, readResponseTextBounded } from "../src/core/list-updates.js";

function textResponse(text) {
  return { text: async () => text };
}

test("response body read options reject accessors before touching the response", async () => {
  let optionReads = 0;
  let responseReads = 0;
  const options = {};
  Object.defineProperty(options, "signal", {
    enumerable: true,
    get() {
      optionReads += 1;
      return undefined;
    }
  });
  const response = {};
  Object.defineProperty(response, "headers", {
    enumerable: true,
    get() {
      responseReads += 1;
      return undefined;
    }
  });

  await assert.rejects(readResponseTextBounded(response, 10, options), /data field/);
  assert.equal(optionReads, 0);
  assert.equal(responseReads, 0);
});

test("response body read options are exact plain-data objects", async () => {
  await assert.rejects(readResponseTextBounded(textResponse("a"), 10, { unknown: true }), /unsupported field/);
  await assert.rejects(readResponseTextBounded(textResponse("a"), 10, []), /plain object/);
  await assert.rejects(readResponseTextBounded(textResponse("a"), 10, Object.create({})), /plain object/);
});

test("response byte limit cannot exceed or type-confuse the production ceiling", async () => {
  for (const invalid of [0, -1, 1.5, "10", Number.MAX_SAFE_INTEGER + 1, Number.POSITIVE_INFINITY, MAX_REMOTE_LIST_BYTES + 1]) {
    await assert.rejects(readResponseTextBounded(textResponse("a"), invalid), /positive safe integer/);
  }
});

test("lower response byte limits remain supported without changing UTF-8 accounting", async () => {
  assert.equal(await readResponseTextBounded(textResponse("ab"), 2), "ab");
  await assert.rejects(readResponseTextBounded(textResponse("ab"), 1), /too large/);
  await assert.rejects(readResponseTextBounded(textResponse("é"), 1), /too large/);
  assert.equal(await readResponseTextBounded(textResponse("é"), 2), "é");
});
