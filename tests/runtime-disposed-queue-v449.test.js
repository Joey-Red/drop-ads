import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M449 shared queue rejects new and not-yet-started work after disposal", () => {
  const queue = source.match(/function queueTask\(task\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(queue, /if \(disposed\) return Promise\.reject\(disposedError\(\)\);/);
  assert.match(queue, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
  assert.match(queue, /taskQueue\.then\(run, run\)/);
});

test("M449 disposal is idempotent while whenIdle still drains admitted work", () => {
  assert.match(source, /function dispose\(\) \{\s*if \(disposed\) return;\s*disposed = true;\s*started = false;/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  assert.doesNotMatch(source, /async function whenIdle\(\)[\s\S]{0,100}disposedError/);
});
