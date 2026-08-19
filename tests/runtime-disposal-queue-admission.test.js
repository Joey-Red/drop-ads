import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
test("new queued core work is rejected after disposal", () => {
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
  assert.match(source, /const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);/s);
  assert.match(source, /function queueListTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);[\s\S]*observedTaskQueue === taskQueue && observedListTaskQueue === listTaskQueue/s);
});
