import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M467 streamed readers capture optional releaseLock with the same receiver boundary", () => {
  assert.match(source, /const releaseLock = captureNativeCompatibleMethod\(reader, "releaseLock", "Remote list body reader releaseLock", NativeReader, false\);/);
  assert.match(source, /return Object\.freeze\(\{ read, cancel, releaseLock \}\);/);
});

test("M467 reader lock release is best effort and runs from the outer read finally", () => {
  assert.match(source, /function releaseReaderLockBestEffort\(releaseLock\) \{\s*if \(!releaseLock\) return;\s*try \{ releaseLock\(\); \} catch \{ \/\* lock cleanup must not replace the read outcome \*\/ \}\s*\}/s);
  assert.match(source, /finally \{[\s\S]*?releaseReaderLockBestEffort\(readerOperations\.releaseLock\);\s*\}/s);
});
