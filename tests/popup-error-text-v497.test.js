import assert from "node:assert/strict";
import test from "node:test";

import { MAX_POPUP_RUNTIME_ERROR_CHARS, popupCaughtErrorMessage, unwrapPopupRuntimeResponse } from "../src/core/popup-boundary.js";

test("popup caught error preserves safe bounded text", () => {
  assert.equal(popupCaughtErrorMessage(new Error("Browser unavailable"), "Fallback"), "Browser unavailable");
});

test("popup caught error falls back for control and line-separator text", () => {
  assert.equal(popupCaughtErrorMessage(new Error("bad\nline"), "Fallback"), "Fallback");
  assert.equal(popupCaughtErrorMessage(new Error(`bad${String.fromCharCode(0x7f)}text`), "Fallback"), "Fallback");
  assert.equal(popupCaughtErrorMessage(new Error(`bad${String.fromCharCode(0x2028)}text`), "Fallback"), "Fallback");
});

test("popup caught error falls back for oversized message text", () => {
  assert.equal(popupCaughtErrorMessage(new Error("x".repeat(MAX_POPUP_RUNTIME_ERROR_CHARS + 1)), "Fallback"), "Fallback");
});

test("popup runtime failure response does not publish unsafe error text", () => {
  assert.throws(
    () => unwrapPopupRuntimeResponse({ ok: false, error: "unsafe\rerror" }, "Safe fallback"),
    (error) => error instanceof Error && error.message === "Safe fallback"
  );
});

test("popup fallback itself must be safe bounded text", () => {
  assert.throws(() => popupCaughtErrorMessage(null, "bad\nfall"), /safe text/);
  assert.throws(() => popupCaughtErrorMessage(null, "x".repeat(MAX_POPUP_RUNTIME_ERROR_CHARS + 1)), /safe text/);
});
