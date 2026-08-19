import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("stream reader operations are captured once before the bounded read loop", () => {
  assert.match(source, /function captureReaderOperations\(reader\)/);
  assert.match(source, /captureNativeCompatibleMethod\(reader, "read"/);
  assert.match(source, /captureNativeCompatibleMethod\(reader, "cancel"/);
  assert.match(source, /const readerOperations = captureReaderOperations\(reader\);/);
  assert.match(source, /await readerOperations\.read\(\)/);
  assert.match(source, /cancelQuietly\(readerOperations\.cancel\)/);
  assert.doesNotMatch(source, /await reader\.read\(\)/);
  assert.doesNotMatch(source, /await reader\.cancel\(\)/);
});

test("native reader compatibility and synthetic own-data admission share one method boundary", () => {
  assert.match(source, /globalThis\.ReadableStreamDefaultReader/);
  assert.match(source, /readPlainDataField\(receiver, key\)/);
  assert.match(source, /capturedReceiverCall\(descriptor\.value, receiver\)/);
  assert.match(source, /capturedReceiverCall\(field\.value, receiver\)/);
});
