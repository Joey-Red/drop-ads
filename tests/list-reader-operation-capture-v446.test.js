import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

function responseWithReader(reader) {
  return {
    body: { getReader() { return reader; } }
  };
}

test("M446 synthetic reader accessors fail before body iteration", async () => {
  let getterCalls = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() { getterCalls += 1; return async () => ({ done: true }); }
  });

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 1024, { headersGet: () => null }),
    /reader read.*own enumerable data function|reader read.*function/i
  );
  assert.equal(getterCalls, 0);
});

test("M446 reader callback-owned bind is never consulted and receiver is preserved", async () => {
  const reader = {
    calls: 0,
    read() {
      assert.equal(this, reader);
      this.calls += 1;
      return Promise.resolve({ done: true });
    },
    cancel() { assert.equal(this, reader); }
  };
  Object.defineProperty(reader.read, "bind", { get() { throw new Error("poisoned bind"); } });
  Object.defineProperty(reader.cancel, "bind", { get() { throw new Error("poisoned bind"); } });

  const text = await readResponseTextBounded(responseWithReader(reader), 1024, { headersGet: () => null });
  assert.equal(text, "");
  assert.equal(reader.calls, 1);
});

test("M446 every streamed cancellation path uses the captured cancel operation", () => {
  const occurrences = source.match(/cancelQuietly\(readerOperations\.cancel\)/g) ?? [];
  assert.ok(occurrences.length >= 5);
  assert.doesNotMatch(source, /reader\.cancel\s*\(/);
  assert.match(source, /const readerOperations = captureReaderOperations\(reader\);/);
});
