import test from "node:test";
import assert from "node:assert/strict";
import { createCosmeticInputCache } from "../src/core/cosmetic-runtime.js";

test("concurrent and repeated requests share one normalized cosmetic-input load", async () => {
  let calls = 0;
  let release;
  const cache = createCosmeticInputCache(async () => {
    calls += 1;
    await new Promise((resolve) => { release = resolve; });
    return { state: { enabled: true }, session: {}, cache: {} };
  });

  const first = cache.get();
  const second = cache.get();
  assert.equal(first, second);
  assert.equal(calls, 0, "loader starts on a microtask");
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  const value = await first;
  assert.equal(await cache.get(), value);
  assert.equal(calls, 1);
});

test("explicit invalidation causes exactly one new shared load", async () => {
  let calls = 0;
  const cache = createCosmeticInputCache(async () => ({ generation: ++calls }));
  assert.equal((await cache.get()).generation, 1);
  assert.equal((await cache.get()).generation, 1);
  cache.invalidate();
  const [a, b] = await Promise.all([cache.get(), cache.get()]);
  assert.equal(a.generation, 2);
  assert.equal(b.generation, 2);
  assert.equal(calls, 2);
});

test("failed input loads do not poison later retries", async () => {
  let calls = 0;
  const cache = createCosmeticInputCache(async () => {
    calls += 1;
    if (calls === 1) throw new Error("simulated storage read failure");
    return { generation: calls };
  });
  await assert.rejects(cache.get(), /simulated storage read failure/);
  assert.equal((await cache.get()).generation, 2);
});
