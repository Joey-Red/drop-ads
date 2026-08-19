import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SETTINGS_RUNTIME_ERROR_CHARS, optionsCaughtErrorMessage } from "../src/core/options-boundary.js";

const fallback = "Could not complete Settings action";

test("Settings caught errors accept exact-bound own-data message and reject one-over", () => {
  const exact = new Error("x".repeat(MAX_SETTINGS_RUNTIME_ERROR_CHARS));
  const oneOver = new Error("x".repeat(MAX_SETTINGS_RUNTIME_ERROR_CHARS + 1));
  assert.equal(optionsCaughtErrorMessage(exact, fallback), exact.message);
  assert.equal(optionsCaughtErrorMessage(oneOver, fallback), fallback);
});

test("Settings caught errors reject empty, missing, and type-confused messages", () => {
  assert.equal(optionsCaughtErrorMessage(new Error(""), fallback), fallback);
  assert.equal(optionsCaughtErrorMessage({ message: 7 }, fallback), fallback);
  assert.equal(optionsCaughtErrorMessage({}, fallback), fallback);
  assert.equal(optionsCaughtErrorMessage("boom", fallback), fallback);
});

test("Settings caught errors never execute a message getter", () => {
  let calls = 0;
  const error = {};
  Object.defineProperty(error, "message", {
    get() { calls += 1; return "getter message"; }
  });
  assert.equal(optionsCaughtErrorMessage(error, fallback), fallback);
  assert.equal(calls, 0);
});

test("Settings caught errors contain descriptor proxy failures", () => {
  let traps = 0;
  const error = new Proxy({}, {
    getOwnPropertyDescriptor() {
      traps += 1;
      throw new Error("trap");
    }
  });
  assert.equal(optionsCaughtErrorMessage(error, fallback), fallback);
  assert.equal(traps, 1);
});

test("Settings caught-error fallback must stay reviewed and bounded", () => {
  assert.throws(() => optionsCaughtErrorMessage(new Error("boom"), ""), /fallback/);
  assert.throws(
    () => optionsCaughtErrorMessage(new Error("boom"), "x".repeat(MAX_SETTINGS_RUNTIME_ERROR_CHARS + 1)),
    /fallback/
  );
});
