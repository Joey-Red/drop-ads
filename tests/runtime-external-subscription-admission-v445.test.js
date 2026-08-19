import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createBackgroundRuntime } from "../src/core/runtime.js";
import { createRuntimeApiShell } from "./helpers/runtime-api-shell.js";

function runtimeWithSideEffectCounter(counter) {
  const api = createRuntimeApiShell({
    storage: {
      local: { get() { counter.count += 1; throw new Error("storage must not be reached"); } },
      session: { get() { counter.count += 1; throw new Error("session storage must not be reached"); } }
    }
  });
  return createBackgroundRuntime({
    api,
    fetchImpl() {
      counter.count += 1;
      throw new Error("fetch must not be reached");
    }
  });
}

function validShape() {
  return {
    id: "example-list",
    title: "Example list",
    format: "third-party",
    sourceUrl: "https://example.com/list.txt",
    enabled: true
  };
}

test("M445 malformed direct external subscriptions fail before storage or fetch work", async () => {
  const counter = { count: 0 };
  const runtime = runtimeWithSideEffectCounter(counter);

  await assert.rejects(runtime.addExternalSubscription({ ...validShape(), builtIn: true }), /unsupported field/);

  let getterRuns = 0;
  const accessor = validShape();
  Object.defineProperty(accessor, "title", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return "getter title";
    }
  });
  await assert.rejects(runtime.addExternalSubscription(accessor), /data field/);
  assert.equal(getterRuns, 0);

  const customPrototype = Object.assign(Object.create({ inherited: true }), validShape());
  await assert.rejects(runtime.addExternalSubscription(customPrototype), /plain object/);

  const { proxy, revoke } = Proxy.revocable(validShape(), {});
  revoke();
  await assert.rejects(runtime.addExternalSubscription(proxy));

  assert.equal(counter.count, 0);
});

test("M445 direct external subscription normalization forces builtIn=false only after detachment", () => {
  const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
  const start = source.indexOf("async function addExternalSubscription(subscription)");
  assert.notEqual(start, -1);
  const section = source.slice(start, source.indexOf("async function commitSubscriptionMutation", start));
  const snapshotIndex = section.indexOf("externalSubscriptionSnapshot(subscription)");
  const normalizeIndex = section.indexOf("normalizeSubscription({ ...sourceRecord, builtIn: false })");
  const stateIndex = section.indexOf("loadState(api)");
  assert.ok(snapshotIndex >= 0 && normalizeIndex > snapshotIndex && stateIndex > normalizeIndex);
});
