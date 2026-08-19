import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M442 shared task queue rejects newly admitted work after disposal", () => {
  assert.match(source, /function disposedError\(\) \{ return new Error\("Background runtime has been disposed"\); \}/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
});

test("M442 queued work checks disposal again before invoking the task", () => {
  assert.match(source, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
  assert.match(source, /const operation = taskQueue\.then\(run, run\);/);
});

test("M442 whenIdle remains a drain path and dispose is idempotent", () => {
  assert.match(source, /function dispose\(\) \{\s*if \(disposed\) return;\s*disposed = true;/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  assert.doesNotMatch(source, /async function whenIdle\(\)[\s\S]{0,120}disposedError/);
});
