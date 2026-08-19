import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function loadLifecycle() {
  const source = await readFile(new URL("../src/content/picker.js", import.meta.url), "utf8");
  const context = {
    globalThis: {
      browser: { runtime: { onMessage: { addListener() {} } } },
      DropAdsSelectorUtils: { generateStableSelector() { return ".target"; } },
      DropAdsContentMessageContract: { accepts() { return false; } }
    },
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(source, context);
  return { lifecycle: context.globalThis.DropAdsPickerLifecycle, source };
}

function fakeTimers({ honorClear = true } = {}) {
  const callbacks = [];
  const cleared = new Set();
  return {
    callbacks,
    setTimeoutImpl(callback) { callbacks.push(callback); return callbacks.length - 1; },
    clearTimeoutImpl(id) { if (honorClear) cleared.add(id); },
    fire(id) { if (!cleared.has(id)) callbacks[id]?.(); }
  };
}

function timerOptions(values) {
  return Object.assign(Object.create(null), values);
}

test("picker lifetime arms one expiration and cancellation prevents cleanup callback", async () => {
  const { lifecycle } = await loadLifecycle();
  assert.equal(lifecycle.PICKER_SESSION_TTL_MS, 120_000);
  const timers = fakeTimers({ honorClear: false });
  let expirations = 0;
  const session = lifecycle.createPickerSessionTimer(timerOptions({
    ttlMs: 10,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl,
    onExpire() { expirations += 1; }
  }));
  session.arm();
  session.cancel();
  timers.fire(0);
  assert.equal(expirations, 0);
});

test("re-arming isolates the new picker session from a stale timeout callback", async () => {
  const { lifecycle } = await loadLifecycle();
  const timers = fakeTimers({ honorClear: false });
  const expired = [];
  const session = lifecycle.createPickerSessionTimer(timerOptions({
    ttlMs: 10,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl,
    onExpire(token) { expired.push(token); }
  }));
  session.arm();
  session.arm();
  timers.fire(0);
  assert.deepEqual(expired, []);
  timers.fire(1);
  assert.deepEqual(expired, [2]);
});

test("picker source routes timeout, pagehide, Escape, Save, and Cancel through cleanup", async () => {
  const { source } = await loadLifecycle();
  assert.match(source, /createPickerSessionTimer\(\{ onExpire: \(\) => cleanupRef\(\) \}\)/);
  assert.match(source, /function onPageHide\(\) \{ cleanup\(\); \}/);
  assert.match(source, /const key = pickerEventKey\(event\);[\s\S]*?if \(key === "Escape"\)[\s\S]*?cleanup\(\)/);
  assert.match(source, /if \(!response\)[\s\S]*?if \(!response\.ok\)[\s\S]*?cleanup\(\)/);
  assert.match(source, /cancel\.addEventListener\("click", cleanup\)/);
  assert.match(source, /lifetime\.cancel\(\)/);
  assert.match(source, /if \(active\) \{[\s\S]*?if \(pickerHostConnected\(active\.host\)\) return;[\s\S]*?active = null;[\s\S]*?bestEffortActiveCleanup\(stale\);[\s\S]*?\}/);
});
