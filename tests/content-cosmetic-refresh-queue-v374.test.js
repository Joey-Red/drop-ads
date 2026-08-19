import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/cosmetic.js", import.meta.url), "utf8");

function loadLifecycle(queueMicrotaskImpl) {
  let sends = 0;
  const queued = [];
  const sandbox = {
    browser: {
      runtime: {
        sendMessage() { sends += 1; return Promise.resolve({ ok: false, error: "offline" }); },
        onMessage: { addListener() {} }
      }
    },
    DropAdsContentMessageContract: {
      accepts() { return false; },
      snapshotCosmeticPolicyResponse() { return Object.freeze({ ok: false }); }
    },
    document: {},
    MutationObserver: class {},
    queueMicrotask(callback) {
      if (queueMicrotaskImpl) return queueMicrotaskImpl(callback, queued);
      queued.push(callback);
    },
    console
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "cosmetic.js" });
  return { lifecycle: sandbox.DropAdsCosmeticLifecycle, queued, sends: () => sends };
}

const normal = loadLifecycle();
assert.ok(normal.lifecycle);
const beforeNormal = normal.sends();
normal.lifecycle.queueRefresh();
normal.lifecycle.queueRefresh();
assert.equal(normal.queued.length, 1);
normal.queued.shift()();
assert.equal(normal.sends(), beforeNormal + 1);

const failing = loadLifecycle(() => { throw new Error("scheduler unavailable"); });
const beforeFailure = failing.sends();
assert.doesNotThrow(() => failing.lifecycle.queueRefresh());
assert.equal(failing.sends(), beforeFailure + 1);
assert.doesNotThrow(() => failing.lifecycle.queueRefresh());
assert.equal(failing.sends(), beforeFailure + 2);

console.log("content cosmetic refresh queue repository coverage present");
