import assert from "node:assert/strict";
import test from "node:test";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";

function makeFixture() {
  let onChanged;
  let queries = 0;
  const api = {
    runtime: { onMessage: { addListener() {}, removeListener() {} } },
    storage: {
      local: { async get() { return {}; } },
      session: { async get() { return {}; } },
      onChanged: { addListener(fn) { onChanged = fn; }, removeListener() {} }
    },
    tabs: { async query() { queries += 1; return []; } }
  };
  const runtime = installCosmeticRuntime({ api, logger: { warn() {} } });
  return { runtime, onChanged: () => onChanged, queries: () => queries };
}

test("relevant storage getters are never executed", async () => {
  const f = makeFixture();
  let reads = 0;
  const changes = {};
  Object.defineProperty(changes, STORAGE_KEY, { enumerable: true, get() { reads += 1; return {}; } });
  f.onChanged()(changes, "local");
  await f.runtime.whenIdle();
  assert.equal(reads, 0);
  assert.equal(f.queries(), 0);
  f.runtime.dispose();
});

test("unrelated changes are ignored and valid cache changes refresh", async () => {
  const f = makeFixture();
  f.onChanged()({ other: {} }, "local");
  await f.runtime.whenIdle();
  assert.equal(f.queries(), 0);
  f.onChanged()({ [LIST_CACHE_KEY]: {} }, "local");
  await f.runtime.whenIdle();
  assert.equal(f.queries(), 1);
  f.runtime.dispose();
});
