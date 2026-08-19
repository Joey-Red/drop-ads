import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("disposed runtime rejects new work before queue admission", () => {
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
});

test("queued work rechecks disposal immediately before task start", () => {
  assert.match(source, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};\s*const operation = taskQueue\.then\(run, run\);/s);
});

test("dispose publishes disposed state before listener rollback while whenIdle remains drainable", () => {
  assert.match(source, /function dispose\(\) \{\s*if \(disposed\) return;\s*disposed = true;\s*started = false;\s*rollbackRegisteredListeners\(0\);\s*\}/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);[\s\S]*observedTaskQueue === taskQueue && observedListTaskQueue === listTaskQueue/s);
});
