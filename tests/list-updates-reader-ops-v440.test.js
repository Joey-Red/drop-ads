import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M440 body reader operations are captured once with receiver semantics", () => {
  assert.match(source, /function captureReaderOperations\(reader\) \{[\s\S]*captureNativeCompatibleMethod\(reader, "read"[\s\S]*captureNativeCompatibleMethod\(reader, "cancel"/);
  assert.match(source, /const readerOperations = captureReaderOperations\(reader\);/);
  assert.match(source, /await readerOperations\.read\(\)/);
  assert.match(source, /cancelQuietly\(readerOperations\.cancel\)/);
  assert.doesNotMatch(source, /await reader\.read\(\)/);
  assert.doesNotMatch(source, /reader\.cancel\(\)/);
});
