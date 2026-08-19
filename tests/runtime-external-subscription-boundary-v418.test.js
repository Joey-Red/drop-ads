import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { createRuntimeApiShell } from "./helpers/runtime-api-shell.js";

function runtimeForBoundaryOnly() {
  return createBackgroundRuntime({
    api: createRuntimeApiShell(),
    fetchImpl: async () => { throw new Error("fetch must not run"); },
    now: () => 0,
    logger: { warn() {}, error() {} }
  });
}

test("M418 direct external subscription rejects accessor data without executing it", async () => {
  const runtime = runtimeForBoundaryOnly();
  let getterCalls = 0;
  const subscription = {
    get id() { getterCalls += 1; return "evil"; },
    title: "Evil",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  };

  await assert.rejects(runtime.addExternalSubscription(subscription));
  assert.equal(getterCalls, 0);
});

test("M418 direct external subscription contains hostile metadata traps before runtime state work", async () => {
  const runtime = runtimeForBoundaryOnly();
  const hostile = new Proxy({}, {
    ownKeys() { throw new Error("ownKeys trap"); }
  });

  await assert.rejects(runtime.addExternalSubscription(hostile));
});

test("M418 snapshots caller data before forcing external builtIn=false", () => {
  const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
  assert.match(source, /const sourceRecord = externalSubscriptionSnapshot\(subscription\);\s*const candidate = normalizeSubscription\(\{ \.\.\.sourceRecord, builtIn: false \}\);/s);
  assert.doesNotMatch(source, /normalizeSubscription\(\{ \.\.\.subscription, builtIn: false \}\)/);
  assert.match(source, /const preparedEntry = makeCacheEntry\(parsed,/);
  assert.match(source, /candidateCache\[candidate\.id\] = preparedEntry;/);
  assert.match(source, /return queueTask\(async \(\) => \{/);
});
