import test from "node:test";
import assert from "node:assert/strict";
import { readQualificationUtf8Stream } from "../tools/qualification-file-io.mjs";

test("M1374 reads a normal async iterable through captured descriptors", async () => {
  const stream = {
    async *[Symbol.asyncIterator]() {
      yield Buffer.from("hello ");
      yield Buffer.from("world\n");
    }
  };
  const text = await readQualificationUtf8Stream(stream, { maxBytes: 64, label: "stream" });
  assert.equal(text, "hello world\n");
});

test("M1374 refuses async-iterator accessors without invoking them", async () => {
  let getterCalls = 0;
  const stream = {};
  Object.defineProperty(stream, Symbol.asyncIterator, {
    configurable: true,
    get() { getterCalls += 1; return async function* () {}; }
  });
  await assert.rejects(
    () => readQualificationUtf8Stream(stream, { maxBytes: 64 }),
    /data-function descriptor/
  );
  assert.equal(getterCalls, 0);
});

test("M1374 closes a captured iterator after bounded-read failure", async () => {
  let returned = false;
  const iterator = {
    index: 0,
    async next() {
      this.index += 1;
      return this.index === 1 ? { value: Buffer.alloc(10), done: false } : { value: undefined, done: true };
    },
    async return() { returned = true; return { value: undefined, done: true }; }
  };
  const stream = {
    [Symbol.asyncIterator]() { return iterator; }
  };
  await assert.rejects(() => readQualificationUtf8Stream(stream, { maxBytes: 4 }), /exceeds 4 bytes/);
  assert.equal(returned, true);
});
