import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { LIST_CACHE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

function textResponse(body, { status = 200, contentType = "text/plain" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    redirected: false,
    status,
    headers: {
      get(name) {
        return String(name).toLowerCase() === "content-type" ? contentType : null;
      }
    },
    async text() { return body; }
  };
}

async function setup() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const base = createFixtureFetch();
  let badMode = null;
  const fetchImpl = async (url, options) => {
    const value = String(url);
    if (value.startsWith("https://") && badMode === "html") {
      return textResponse("<!doctype html><html><body>sign in</body></html>", { contentType: "text/html" });
    }
    if (value.startsWith("https://") && badMode === "empty") {
      return textResponse("! maintenance\n# no network rules\n");
    }
    return base.fetchImpl(url, options);
  };

  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();

  return {
    mock,
    runtime,
    setBadMode(value) { badMode = value; }
  };
}

for (const badMode of ["html", "empty"]) {
  test(`remote ${badMode} 200 responses keep last-known-good policy without no-op DNR/storage rewrites`, async () => {
    const { mock, runtime, setBadMode } = await setup();
    const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
    const rulesBefore = structuredClone([...mock.inspect.dynamicRules.values()]);
    const dnrUpdatesBefore = mock.inspect.dnrUpdates.length;
    const storageChangesBefore = mock.inspect.storageChanges.length;

    setBadMode(badMode);
    const result = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
    await runtime.whenIdle();

    assert.deepEqual(result, { ok: true, status: "fallback" });
    assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
    assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBefore);
    assert.equal(mock.inspect.dnrUpdates.length, dnrUpdatesBefore);
    assert.equal(mock.inspect.storageChanges.length, storageChangesBefore);
  });
}
