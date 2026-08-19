import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M448 shared runtime queue rejects work after disposal and rechecks before task start", () => {
  assert.match(source, /function disposedError\(\) \{ return new Error\("Background runtime has been disposed"\); \}/);
  assert.match(source, /function queueTask\(task\) \{\s*if \(disposed\) return Promise\.reject\(disposedError\(\)\);\s*const run = \(\) => \{\s*if \(disposed\) throw disposedError\(\);\s*return task\(\);\s*\};\s*const operation = taskQueue\.then\(run, run\);/s);
});

test("M448 disposal remains idempotent while whenIdle can still drain admitted work", () => {
  assert.match(source, /function dispose\(\) \{\s*if \(disposed\) return;\s*disposed = true;/s);
  assert.match(source, /async function whenIdle\(\) \{[\s\S]*await Promise\.all\(\[observedTaskQueue, observedListTaskQueue\]\);/s);
  const whenIdleBlock = source.slice(source.indexOf("async function whenIdle()"), source.indexOf("const controller = Object.freeze", source.indexOf("async function whenIdle()")));
  assert.doesNotMatch(whenIdleBlock, /disposedError|if \(disposed\)/);
});
