import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, MENU_BLOCK_EXACT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

function makeRuntime(mock, fixture = createFixtureFetch()) {
  return {
    fixture,
    runtime: createBackgroundRuntime({
      api: mock.api,
      fetchImpl: fixture.fetchImpl,
      now: () => 2_000_000,
      logger: quietLogger
    }).start()
  };
}

test("extension updates repair persisted state without resetting user choices", async () => {
  const mock = createMockWebExtension({
    dynamicRuleLimit: 30_000,
    initialStorage: {
      [STORAGE_KEY]: {
        enabled: false,
        autoSubmitCommunity: true,
        cookieMode: "all",
        personalBlock: [{ kind: "domain", value: "kept.example" }],
        subscriptions: [{
          id: "drop-ads-default",
          title: "Drop Ads Community",
          format: "drop-ads-v1",
          sourceUrl: "https://raw.githubusercontent.com/Joey-Red/drop-ads/main/lists/default.txt",
          enabled: false,
          builtIn: true
        }]
      }
    }
  });
  const { runtime } = makeRuntime(mock);

  mock.events.runtimeInstalled.emit({ reason: "update" });
  await runtime.whenIdle();

  const state = mock.inspect.storageData[STORAGE_KEY];
  assert.equal(state.enabled, false);
  assert.equal(state.autoSubmitCommunity, true);
  assert.equal(state.cookieMode, "all");
  assert.ok(state.personalBlock.some((rule) => rule.value === "kept.example"));
  assert.equal(state.subscriptions.find((item) => item.id === "drop-ads-default").enabled, false);
  assert.ok(state.subscriptions.some((item) => item.id === "hagezi-pro-mini"));
  assert.deepEqual([...mock.inspect.dynamicRules.values()], []);
});

test("duplicate local blocks never create duplicate community submissions", async () => {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const { runtime } = makeRuntime(mock);
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();

  const state = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  state.autoSubmitCommunity = true;
  await mock.api.storage.local.set({ [STORAGE_KEY]: state });
  await runtime.whenIdle();

  const info = {
    menuItemId: MENU_BLOCK_EXACT,
    srcUrl: "https://duplicate.example/ad.js?private=value"
  };
  mock.events.menuClicked.emit(info);
  await runtime.whenIdle();
  mock.events.menuClicked.emit(info);
  await runtime.whenIdle();

  assert.equal(mock.inspect.tabs.length, 1);
  const persisted = mock.inspect.storageData[STORAGE_KEY];
  assert.equal(persisted.personalBlock.filter((rule) => rule.value.startsWith("https://duplicate.example/")).length, 1);
});

test("legacy combined DNR limit is honored when the modern constant is absent", () => {
  const mock = createMockWebExtension({ dynamicRuleLimit: 5_000 });
  delete mock.api.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES;
  mock.api.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES = 4_321;
  const { runtime } = makeRuntime(mock);
  assert.equal(runtime.dynamicRuleLimit(), 4_321);
});

test("unknown runtime messages are ignored instead of opening a response channel", () => {
  const mock = createMockWebExtension({ dynamicRuleLimit: 5_000 });
  makeRuntime(mock);
  const results = mock.events.runtimeMessage.emit({ type: "drop-ads:not-a-real-message" }, {}, () => {});
  assert.deepEqual(results, [false]);
});
