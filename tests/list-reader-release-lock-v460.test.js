import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M460 captures optional releaseLock with the reader receiver", () => {
  assert.match(source, /const releaseLock = captureNativeCompatibleMethod\(reader, "releaseLock", "Remote list body reader releaseLock", NativeReader, false\);/);
  assert.match(source, /return Object\.freeze\(\{ read, cancel, releaseLock \}\);/);
});

test("M460 releases the reader lock best effort on every streamed exit", () => {
  assert.match(source, /function releaseReaderLockBestEffort\(releaseLock\)/);
  assert.match(source, /finally \{[\s\S]*releaseReaderLockBestEffort\(readerOperations\.releaseLock\);\s*\}/s);
  assert.match(source, /try \{ releaseLock\(\); \} catch \{ \/\* lock cleanup must not replace the read outcome \*\/ \}/);
});
