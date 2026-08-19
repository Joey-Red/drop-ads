import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS,
  installOptionalBackgroundFeatures
} from "../src/core/background-bootstrap.js";

test("M439 rejects oversized raw feature names before accepting descriptor work", () => {
  const oversized = " ".repeat(MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS + 1);
  assert.throws(
    () => installOptionalBackgroundFeatures([{ name: oversized, install() {} }]),
    new RegExp(`exceeds ${MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS} characters`)
  );
});

test("M439 retains exact max trimmed feature names", () => {
  const name = "x".repeat(MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS);
  const status = installOptionalBackgroundFeatures([{ name, install() {} }]);
  assert.equal(status[name], "installed");
});

test("M439 still rejects surrounding whitespace within the raw ceiling", () => {
  assert.throws(
    () => installOptionalBackgroundFeatures([{ name: " feature ", install() {} }]),
    /must already be trimmed/
  );
});
