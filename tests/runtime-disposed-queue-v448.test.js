import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M448 shared task queue rejects newly admitted work after disposal", () => {
  assert.match(source, /function disposedError\(\) \{ return new Error\("Background runtime has been disposed"\); \}/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
});

test("M448 queued but not started work rechecks disposal at execution time", () => {
  assert.match(source, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
  assert.match(source, /const operation = taskQueue\.then\(run, run\);/);
});

test("M448 whenIdle remains a drain and disposal marks the runtime before teardown", () => {
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  assert.match(source, /function dispose\(\) \{[\s\S]*disposed = true;/);
  const controllerBlock = source.slice(source.indexOf("const controller = Object.freeze"));
  assert.match(controllerBlock, /whenIdle/);
});
