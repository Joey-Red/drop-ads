import test from "node:test";
import assert from "node:assert/strict";
import {
  unwrapOptionsImportResponse,
  unwrapOptionsRefreshResponse,
  unwrapOptionsSimpleResponse,
  unwrapOptionsSubscriptionResponse
} from "../src/core/options-boundary.js";

test("Settings simple response accepts exact success and uses fallback-safe failures", () => {
  assert.equal(unwrapOptionsSimpleResponse({ ok: true }, "fallback"), true);
  assert.throws(() => unwrapOptionsSimpleResponse({ ok: false, error: "denied" }, "fallback"), /denied/);
  assert.throws(() => unwrapOptionsSimpleResponse({ ok: false, error: 7 }, "fallback"), /fallback/);
  assert.throws(() => unwrapOptionsSimpleResponse({ ok: true, extra: true }, "fallback"));
  assert.throws(() => unwrapOptionsSimpleResponse({ ok: true, error: undefined }, "fallback"), /must not contain error/);
});

test("Settings subscription response detaches reviewed result fields", () => {
  assert.deepEqual(
    unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "x", title: "Example" } }, "fallback"),
    { id: "x", title: "Example" }
  );
  assert.deepEqual(
    unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "x", enabled: true, source: "fetched" } }, "fallback"),
    { id: "x", enabled: true, source: "fetched" }
  );
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "", title: "Example" } }, "fallback"));
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "x", source: "remote" } }, "fallback"));
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "x", extra: true } }, "fallback"));
});

test("Settings subscription response rejects nested accessors without getter execution", () => {
  let calls = 0;
  const subscription = { id: "x" };
  Object.defineProperty(subscription, "title", {
    enumerable: true,
    get() { calls += 1; return "unsafe"; }
  });
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: true, subscription }, "fallback"));
  assert.equal(calls, 0);
});

test("Settings subscription outcome excludes opposite-branch fields", () => {
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: true, subscription: { id: "x" }, error: undefined }, "fallback"), /must not contain error/);
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: false, subscription: undefined, error: "denied" }, "fallback"), /must not contain subscription/);
  assert.throws(() => unwrapOptionsSubscriptionResponse({ ok: false, subscription: { id: "x" } }, "fallback"), /must not contain subscription/);
});

test("Settings refresh response accepts only reviewed statuses and exact outcomes", () => {
  for (const status of ["updated", "updated-with-fallback", "fallback", "current"]) {
    assert.equal(unwrapOptionsRefreshResponse({ ok: true, status }, "fallback"), status);
  }
  assert.throws(() => unwrapOptionsRefreshResponse({ ok: true, status: "done" }, "fallback"));
  assert.throws(() => unwrapOptionsRefreshResponse({ ok: true, status: 1 }, "fallback"));
  assert.throws(() => unwrapOptionsRefreshResponse({ ok: true, status: "current", error: "ambiguous" }, "fallback"), /must not contain error/);
  assert.throws(() => unwrapOptionsRefreshResponse({ ok: false, status: undefined, error: "denied" }, "fallback"), /must not contain status/);
});

test("Settings import response enforces safe reviewed count bounds and exact outcomes", () => {
  assert.deepEqual(
    unwrapOptionsImportResponse({ ok: true, subscriptions: 128, fetchedSources: 16 }, "fallback"),
    { subscriptions: 128, fetchedSources: 16 }
  );
  assert.throws(() => unwrapOptionsImportResponse({ ok: true, subscriptions: 129, fetchedSources: 0 }, "fallback"));
  assert.throws(() => unwrapOptionsImportResponse({ ok: true, subscriptions: 1, fetchedSources: 17 }, "fallback"));
  assert.throws(() => unwrapOptionsImportResponse({ ok: true, subscriptions: 1.5, fetchedSources: 0 }, "fallback"));
  assert.throws(() => unwrapOptionsImportResponse({ ok: true, subscriptions: 1, fetchedSources: 0, error: undefined }, "fallback"), /must not contain error/);
  assert.throws(() => unwrapOptionsImportResponse({ ok: false, subscriptions: undefined, error: "denied" }, "fallback"), /must not contain subscriptions/);
  assert.throws(() => unwrapOptionsImportResponse({ ok: false, fetchedSources: undefined, error: "denied" }, "fallback"), /must not contain fetchedSources/);
});
