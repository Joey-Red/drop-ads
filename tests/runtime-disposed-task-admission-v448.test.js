import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M448 shared queue rejects new and not-yet-started work after disposal", () => {
  assert.match(source, /function disposedError\(\) \{ return new Error\("Background runtime has been disposed"\); \}/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);\s*const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};/s);
  assert.match(source, /function queueListTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
});
