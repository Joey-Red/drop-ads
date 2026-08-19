import test from "node:test";
import assert from "node:assert/strict";
import { unwrapSettingsResetResponse } from "../src/core/settings-reset-response.js";

test("configured reset accepts only the exact successful result", () => {
  const result = unwrapSettingsResetResponse({ ok: true, result: { changed: true } });
  assert.deepEqual({ ...result }, { changed: true });
  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => unwrapSettingsResetResponse({ ok: true, result: { changed: false } }), /changed must be true/);
  assert.throws(() => unwrapSettingsResetResponse({ ok: true, result: { changed: true, extra: 1 } }), /unexpected fields/);
  assert.throws(() => unwrapSettingsResetResponse({ ok: true, result: { changed: true }, extra: 1 }), /unexpected fields/);
});

test("configured reset failure remains bounded and exact", () => {
  assert.throws(() => unwrapSettingsResetResponse({ ok: false, error: "Reset failed" }), /Reset failed/);
  assert.throws(() => unwrapSettingsResetResponse({ ok: false, error: "", extra: 1 }), /unexpected fields/);
  assert.throws(() => unwrapSettingsResetResponse({ ok: false, error: "x".repeat(1025) }, "Safe fallback"), /Safe fallback/);
});
