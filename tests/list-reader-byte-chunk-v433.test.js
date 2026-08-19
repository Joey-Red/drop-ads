import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M433 revoked byte-chunk proxy is rejected through the reviewed chunk error", async () => {
  const { proxy, revoke } = Proxy.revocable(new Uint8Array([97]), {});
  revoke();
  let cancelled = 0;
  const reader = {
    async read() { return { done: false, value: proxy }; },
    async cancel() { cancelled += 1; }
  };
  const response = {
    body: { getReader() { return reader; } },
    headers: null
  };

  await assert.rejects(
    readResponseTextBounded(response, 32, { headersGet: null }),
    /invalid byte chunk/
  );
  assert.equal(cancelled, 1);
});

test("M433 real Uint8Array chunks still decode normally", async () => {
  let step = 0;
  const reader = {
    async read() {
      step += 1;
      return step === 1
        ? { done: false, value: new Uint8Array([111, 107]) }
        : { done: true };
    },
    async cancel() {}
  };
  const response = { body: { getReader() { return reader; } }, headers: null };
  assert.equal(await readResponseTextBounded(response, 32, { headersGet: null }), "ok");
});

test("M433 ArrayBuffer view gate precedes Uint8Array instanceof", () => {
  assert.match(source, /return ArrayBuffer\.isView\(value\) && value instanceof Uint8Array;/);
  assert.doesNotMatch(source, /!valueField\.present \|\| !\(valueField\.value instanceof Uint8Array\)/);
});
