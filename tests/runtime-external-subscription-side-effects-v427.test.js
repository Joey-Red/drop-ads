import test from "node:test";
import assert from "node:assert/strict";

import { createBackgroundRuntime } from "../src/core/runtime.js";
import { createRuntimeApiShell } from "./helpers/runtime-api-shell.js";

function runtimeHarness() {
  let fetchCalls = 0;
  const controller = createBackgroundRuntime({
    api: createRuntimeApiShell(),
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("fetch should not run");
    }
  });
  return { controller, fetchCalls: () => fetchCalls };
}

function validExternal(overrides = {}) {
  return {
    id: "test-list",
    title: "Test list",
    format: "hosts",
    sourceUrl: "https://example.com/hosts.txt",
    ...overrides
  };
}

test("M427 caller-supplied builtIn and unknown fields reject before storage or fetch work", async () => {
  for (const candidate of [validExternal({ builtIn: true }), validExternal({ surprise: true })]) {
    const { controller, fetchCalls } = runtimeHarness();
    await assert.rejects(controller.addExternalSubscription(candidate), /unsupported field/);
    assert.equal(fetchCalls(), 0);
  }
});

test("M427 accessor and custom-prototype inputs reject without executing getters or fetch", async () => {
  let getterCalls = 0;
  const accessor = validExternal();
  Object.defineProperty(accessor, "title", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "unsafe";
    }
  });
  const customPrototype = Object.assign(Object.create({ inherited: true }), validExternal());

  for (const candidate of [accessor, customPrototype]) {
    const { controller, fetchCalls } = runtimeHarness();
    await assert.rejects(controller.addExternalSubscription(candidate));
    assert.equal(fetchCalls(), 0);
  }
  assert.equal(getterCalls, 0);
});

test("M427 revoked proxy input fails through the schema boundary before fetch", async () => {
  const { proxy, revoke } = Proxy.revocable(validExternal(), {});
  revoke();
  const { controller, fetchCalls } = runtimeHarness();
  await assert.rejects(controller.addExternalSubscription(proxy), /plain object|inspectable/i);
  assert.equal(fetchCalls(), 0);
});
