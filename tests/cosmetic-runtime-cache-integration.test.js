import test from "node:test";
import assert from "node:assert/strict";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { DEFAULT_STATE, LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { SESSION_STORAGE_KEY } from "../src/core/session.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function state(overrides = {}) {
  return {
    ...structuredClone(DEFAULT_STATE),
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    ...overrides
  };
}

test("runtime reuses cosmetic inputs until a relevant storage area changes", async () => {
  const mock = createMockWebExtension({ initialStorage: { [STORAGE_KEY]: state(), [LIST_CACHE_KEY]: {} } });
  let localGets = 0;
  let sessionGets = 0;
  const localGet = mock.api.storage.local.get.bind(mock.api.storage.local);
  const sessionGet = mock.api.storage.session.get.bind(mock.api.storage.session);
  mock.api.storage.local.get = async (...args) => { localGets += 1; return localGet(...args); };
  mock.api.storage.session.get = async (...args) => { sessionGets += 1; return sessionGet(...args); };

  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });
  await runtime.currentPolicy({ url: "https://one.example/page" });
  const firstReads = { localGets, sessionGets };
  assert.deepEqual(firstReads, { localGets: 2, sessionGets: 1 });

  await runtime.currentPolicy({ url: "https://two.example/page" });
  assert.deepEqual({ localGets, sessionGets }, firstReads, "another hostname must reuse inputs without retaining a per-host result");

  await mock.api.storage.local.set({ unrelatedPreference: true });
  await runtime.whenIdle();
  await runtime.currentPolicy({ url: "https://three.example/page" });
  assert.deepEqual({ localGets, sessionGets }, firstReads, "unrelated local storage must not invalidate cosmetic inputs");

  await mock.api.storage.local.set({ [STORAGE_KEY]: state({ enabled: false }) });
  await runtime.whenIdle();
  const disabled = await runtime.currentPolicy({ url: "https://one.example/page" });
  assert.equal(disabled.enabled, false);
  assert.deepEqual({ localGets, sessionGets }, { localGets: 4, sessionGets: 2 });

  await mock.api.storage.session.set({ [SESSION_STORAGE_KEY]: { disabledSites: ["one.example"] } });
  await runtime.whenIdle();
  await runtime.currentPolicy({ url: "https://one.example/page" });
  assert.deepEqual({ localGets, sessionGets }, { localGets: 6, sessionGets: 3 });

  await mock.api.storage.local.set({ [LIST_CACHE_KEY]: {} });
  await runtime.whenIdle();
  await runtime.currentPolicy({ url: "https://one.example/page" });
  assert.deepEqual({ localGets, sessionGets }, { localGets: 8, sessionGets: 4 });
});
