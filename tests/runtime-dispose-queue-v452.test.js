import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M452 shared queue rejects newly admitted and not-yet-started work after disposal", () => {
  assert.match(source, /function disposedError\(\)/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
  assert.match(source, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
});

test("M452 whenIdle remains a drain path outside queue admission", () => {
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  assert.doesNotMatch(source, /whenIdle:\s*\(\)\s*=>\s*queueTask/);
});
