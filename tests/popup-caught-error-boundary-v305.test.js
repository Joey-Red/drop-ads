import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MAX_POPUP_RUNTIME_ERROR_CHARS, popupCaughtErrorMessage } from "../src/core/popup-boundary.js";

const fallback = "Could not complete popup action";

test("popup caught errors accept exact-bound own-data message and reject one-over", () => {
  const exact = new Error("x".repeat(MAX_POPUP_RUNTIME_ERROR_CHARS));
  const oneOver = new Error("x".repeat(MAX_POPUP_RUNTIME_ERROR_CHARS + 1));
  assert.equal(popupCaughtErrorMessage(exact, fallback), exact.message);
  assert.equal(popupCaughtErrorMessage(oneOver, fallback), fallback);
});

test("popup caught errors reject empty, type-confused, and missing messages", () => {
  assert.equal(popupCaughtErrorMessage(new Error(""), fallback), fallback);
  assert.equal(popupCaughtErrorMessage({ message: 7 }, fallback), fallback);
  assert.equal(popupCaughtErrorMessage({}, fallback), fallback);
  assert.equal(popupCaughtErrorMessage("boom", fallback), fallback);
});

test("popup caught errors never execute a message getter", () => {
  let calls = 0;
  const error = {};
  Object.defineProperty(error, "message", {
    get() { calls += 1; return "getter message"; }
  });
  assert.equal(popupCaughtErrorMessage(error, fallback), fallback);
  assert.equal(calls, 0);
});

test("popup caught errors contain descriptor proxy failures", () => {
  let traps = 0;
  const error = new Proxy({}, {
    getOwnPropertyDescriptor() {
      traps += 1;
      throw new Error("trap");
    }
  });
  assert.equal(popupCaughtErrorMessage(error, fallback), fallback);
  assert.equal(traps, 1);
});

test("popup caught-error fallback must stay reviewed and bounded", () => {
  assert.throws(() => popupCaughtErrorMessage(new Error("boom"), ""), /fallback/);
  assert.throws(
    () => popupCaughtErrorMessage(new Error("boom"), "x".repeat(MAX_POPUP_RUNTIME_ERROR_CHARS + 1)),
    /fallback/
  );
});

test("popup source routes caught status messages through the bounded helper", async () => {
  const source = await readFile(new URL("../src/popup/popup.js", import.meta.url), "utf8");
  assert.match(source, /popupCaughtErrorMessage/);
  assert.doesNotMatch(source, /error\s+instanceof\s+Error\s*\?\s*error\.message/);
  assert.match(source, /Could not start element picker on this page/);
});
