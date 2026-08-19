import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SETTINGS_RUNTIME_ERROR_CHARS,
  unwrapOptionsImportResponse,
  unwrapOptionsRefreshResponse,
  unwrapOptionsRuntimeResponse,
  unwrapOptionsSimpleResponse,
  unwrapOptionsSubscriptionResponse
} from "../src/core/options-boundary.js";

const exact = "x".repeat(MAX_SETTINGS_RUNTIME_ERROR_CHARS);
const oneOver = `${exact}x`;
const fallback = "reviewed fallback";

function expectExact(helper, response) {
  assert.throws(
    () => helper(response, fallback),
    (error) => error instanceof Error && error.message === exact
  );
}

function expectFallback(helper, response) {
  assert.throws(
    () => helper(response, fallback),
    (error) => error instanceof Error && error.message === fallback
  );
}

test("generic Settings failures enforce the shared 1,024-character error ceiling", () => {
  expectExact(unwrapOptionsRuntimeResponse, { ok: false, error: exact });
  expectFallback(unwrapOptionsRuntimeResponse, { ok: false, error: oneOver });
  expectFallback(unwrapOptionsRuntimeResponse, { ok: false, error: 7 });
});

test("simple Settings failures enforce the shared error ceiling", () => {
  expectExact(unwrapOptionsSimpleResponse, { ok: false, error: exact });
  expectFallback(unwrapOptionsSimpleResponse, { ok: false, error: oneOver });
});

test("subscription Settings failures enforce the shared error ceiling", () => {
  expectExact(unwrapOptionsSubscriptionResponse, { ok: false, error: exact });
  expectFallback(unwrapOptionsSubscriptionResponse, { ok: false, error: oneOver });
});

test("refresh Settings failures enforce the shared error ceiling", () => {
  expectExact(unwrapOptionsRefreshResponse, { ok: false, error: exact });
  expectFallback(unwrapOptionsRefreshResponse, { ok: false, error: oneOver });
});

test("import Settings failures enforce the shared error ceiling", () => {
  expectExact(unwrapOptionsImportResponse, { ok: false, error: exact });
  expectFallback(unwrapOptionsImportResponse, { ok: false, error: oneOver });
});

test("Settings failure fallbacks are themselves bounded reviewed strings", () => {
  for (const helper of [
    unwrapOptionsRuntimeResponse,
    unwrapOptionsSimpleResponse,
    unwrapOptionsSubscriptionResponse,
    unwrapOptionsRefreshResponse,
    unwrapOptionsImportResponse
  ]) {
    assert.throws(() => helper({ ok: false }, ""), /fallback must be a non-empty string/);
    assert.throws(
      () => helper({ ok: false }, "f".repeat(MAX_SETTINGS_RUNTIME_ERROR_CHARS + 1)),
      /fallback must be a non-empty string/
    );
  }
});
