import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M436 streamed reader operations are captured once before the read loop", () => {
  assert.match(source, /function captureReaderOperations\(reader\)/);
  assert.match(source, /ReadableStreamDefaultReader/);
  assert.match(source, /const readerOperations = captureReaderOperations\(reader\);/);
  assert.match(source, /streamedReaderResultSnapshot\(await readerOperations\.read\(\)\)/);
  assert.match(source, /cancelQuietly\(readerOperations\.cancel\)/);
  assert.doesNotMatch(source, /await reader\.read\(\)/);
  assert.doesNotMatch(source, /await reader\.cancel\(\)/);
});

test("M436 captured reader methods preserve native and synthetic boundaries", () => {
  assert.match(source, /captureNativeCompatibleMethod\(reader, "read", "Remote list body reader read", NativeReader, true\)/);
  assert.match(source, /captureNativeCompatibleMethod\(reader, "cancel", "Remote list body reader cancel", NativeReader, false\)/);
  assert.match(source, /readPlainDataField\(receiver, key\)/);
});
