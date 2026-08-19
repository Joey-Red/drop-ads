import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M443 shared task queue rejects new and not-yet-started work after dispose", () => {
  const start = source.indexOf("function queueTask(task)");
  const end = source.indexOf("function queueRuleRepair", start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /if \(disposed\) return Promise\.reject\(disposedError\(\)\);/);
  assert.match(block, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
  assert.match(block, /const operation = taskQueue\.then\(run, run\);/);
});

test("M443 whenIdle drains both queues without using a disposed admission gate", () => {
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  const controllerStart = source.indexOf("const controller = Object.freeze");
  const controller = source.slice(controllerStart);
  assert.match(controller, /start, dispose, whenIdle/);
  assert.doesNotMatch(source.slice(source.indexOf("async function whenIdle"), controllerStart), /queueTask\(/);
});
