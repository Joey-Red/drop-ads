import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, MAX_BACKGROUND_RUNTIME_ERROR_CHARS } from "../src/core/runtime.js";

function event() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function harness() {
  const events = {
    installed: event(), startup: event(), message: event(), context: event(), alarm: event(), storage: event()
  };
  let failure = new Error("boom");
  const api = {
    runtime: { onInstalled: events.installed, onStartup: events.startup, onMessage: events.message },
    storage: {
      local: { get: async () => { throw failure; }, set: async () => {} },
      session: { get: async () => ({}), set: async () => {} },
      onChanged: events.storage
    },
    declarativeNetRequest: {},
    contextMenus: { onClicked: events.context },
    alarms: { onAlarm: events.alarm, async clear() { return false; }, create() {} },
    tabs: {}
  };
  const runtime = createBackgroundRuntime({
    api,
    fetchImpl: async () => { throw new Error("unused fetch"); },
    now: () => 0,
    logger: { warn() {}, error() {} }
  });
  runtime.start();
  const listener = [...events.message.listeners][0];
  return { runtime, listener, setFailure(value) { failure = value; } };
}

async function dispatch(h, sendResponse = (value) => value) {
  let response;
  const handled = h.listener(
    { type: "drop-ads:set-enabled", enabled: false },
    {},
    (value) => { response = value; return sendResponse(value); }
  );
  assert.equal(handled, true);
  await h.runtime.whenIdle();
  await Promise.resolve();
  return response;
}

test("M426 preserves a bounded standard Error own-data message", async () => {
  const h = harness();
  h.setFailure(new Error("small failure"));
  assert.deepEqual(await dispatch(h), { ok: false, error: "small failure" });
  h.runtime.dispose();
});

test("M426 does not execute hostile message accessors and falls back", async () => {
  const h = harness();
  let getterCalls = 0;
  const hostile = {};
  Object.defineProperty(hostile, "message", {
    get() { getterCalls += 1; return "do not read"; }
  });
  h.setFailure(hostile);
  assert.deepEqual(await dispatch(h), { ok: false, error: "Could not change global protection" });
  assert.equal(getterCalls, 0);
  h.runtime.dispose();
});

test("M426 rejects oversized error text and contains throwing response delivery", async () => {
  const h = harness();
  h.setFailure(new Error("x".repeat(MAX_BACKGROUND_RUNTIME_ERROR_CHARS + 1)));
  assert.deepEqual(await dispatch(h), { ok: false, error: "Could not change global protection" });

  h.setFailure(new Error("still bounded"));
  await assert.doesNotReject(async () => {
    await dispatch(h, () => { throw new Error("response channel closed"); });
  });
  h.runtime.dispose();
});
