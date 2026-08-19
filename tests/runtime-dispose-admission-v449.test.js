import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M449 shared runtime queue rejects new and not-yet-started work after disposal", () => {
  assert.match(source, /let disposed = false;/);
  assert.match(source, /function disposedError\(\) \{ return new Error\("Background runtime has been disposed"\); \}/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);\s*const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);/s);
});

test("M449 disposal makes listeners inert while whenIdle remains drainable", () => {
  assert.match(source, /function dispose\(\) \{\s*if \(disposed\) return;\s*disposed = true;\s*started = false;\s*rollbackRegisteredListeners\(0\);\s*\}/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  assert.match(source, /const onMessage = \(message, _sender, sendResponse\) => \{\s*if \(disposed\) return false;/s);
  assert.match(source, /function start\(\) \{\s*if \(disposed\) throw disposedError\(\);/s);
});
