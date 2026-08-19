import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS,
  MAX_OPTIONAL_BACKGROUND_FEATURES,
  bootstrapBackground,
  installOptionalBackgroundFeatures
} from "../src/core/background-bootstrap.js";

function logger() {
  const warnings = [];
  return {
    warnings,
    warn(...args) { warnings.push(args); }
  };
}

function assertStatus(actual, expected) {
  assert.equal(Object.getPrototypeOf(actual), null);
  assert.deepEqual({ ...actual }, expected);
}

test("background bootstrap starts mandatory core/recovery before optional features and passes the core controller", () => {
  const order = [];
  const log = logger();
  const core = { id: "core" };
  const result = bootstrapBackground({
    startCore() { order.push("core"); return core; },
    installMandatoryRecovery(value) { assert.equal(value, core); order.push("recovery"); },
    optionalFeatures: [
      { name: "one", install(value) { assert.equal(value, core); order.push("one"); } },
      { name: "two", install(value) { assert.equal(value, core); order.push("two"); } }
    ],
    logger: log
  });

  assert.equal(result.core, core);
  assertStatus(result.features, { one: "installed", two: "installed" });
  assert.deepEqual(order, ["core", "recovery", "one", "two"]);
  assert.equal(log.warnings.length, 0);
});

test("one optional feature failure does not stop later optional features", () => {
  const order = [];
  const log = logger();
  const result = bootstrapBackground({
    startCore() { order.push("core"); return {}; },
    installMandatoryRecovery() { order.push("recovery"); },
    optionalFeatures: [
      { name: "broken", install() { order.push("broken"); throw new Error("boom"); } },
      { name: "healthy", install() { order.push("healthy"); } }
    ],
    logger: log
  });

  assertStatus(result.features, { broken: "failed", healthy: "installed" });
  assert.deepEqual(order, ["core", "recovery", "broken", "healthy"]);
  assert.equal(log.warnings.length, 1);
  assert.match(String(log.warnings[0][0]), /broken/);
});

test("multiple optional failures are isolated independently", () => {
  const log = logger();
  const core = { id: "core" };
  const result = installOptionalBackgroundFeatures([
    { name: "first", install(value) { assert.equal(value, core); throw new Error("first"); } },
    { name: "second", install(value) { assert.equal(value, core); throw new Error("second"); } },
    { name: "third", install(value) { assert.equal(value, core); } }
  ], { logger: log, core });

  assertStatus(result, { first: "failed", second: "failed", third: "installed" });
  assert.equal(log.warnings.length, 2);
});

test("optional feature validation is complete before any installer runs", () => {
  const calls = [];
  assert.throws(() => installOptionalBackgroundFeatures([
    { name: "healthy", install() { calls.push("healthy"); } },
    { name: "broken", install: null }
  ]), /descriptor is invalid/);
  assert.deepEqual(calls, []);
});

test("background preflights optional descriptors before mandatory startup side effects", () => {
  const calls = [];
  assert.throws(() => bootstrapBackground({
    startCore() { calls.push("core"); return {}; },
    installMandatoryRecovery() { calls.push("recovery"); },
    optionalFeatures: [
      { name: "duplicate", install() {} },
      { name: "duplicate", install() {} }
    ]
  }), /Duplicate optional background feature/);
  assert.deepEqual(calls, []);
});

test("optional registry enforces count and canonical name bounds", () => {
  const tooMany = Array.from({ length: MAX_OPTIONAL_BACKGROUND_FEATURES + 1 }, (_, index) => ({
    name: `feature-${index}`,
    install() {}
  }));
  assert.throws(() => installOptionalBackgroundFeatures(tooMany), /at most 32|32/);
  assert.doesNotThrow(() => installOptionalBackgroundFeatures([{
    name: "a".repeat(MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS),
    install() {}
  }]));
  assert.throws(() => installOptionalBackgroundFeatures([{
    name: "a".repeat(MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS + 1),
    install() {}
  }]), /name exceeds 64 characters/);
  assert.throws(() => installOptionalBackgroundFeatures([{ name: " padded ", install() {} }]), /already be trimmed/);
});

test("mandatory core failure still fails bootstrap and skips all later installers", () => {
  let recoveryCalled = false;
  let optionalCalled = false;
  assert.throws(() => bootstrapBackground({
    startCore() { throw new Error("core unavailable"); },
    installMandatoryRecovery() { recoveryCalled = true; },
    optionalFeatures: [{ name: "optional", install() { optionalCalled = true; } }]
  }), /core unavailable/);
  assert.equal(recoveryCalled, false);
  assert.equal(optionalCalled, false);
});

test("mandatory recovery failure is not hidden as an optional feature failure", () => {
  let optionalCalled = false;
  assert.throws(() => bootstrapBackground({
    startCore() { return {}; },
    installMandatoryRecovery() { throw new Error("recovery unavailable"); },
    optionalFeatures: [{ name: "optional", install() { optionalCalled = true; } }]
  }), /recovery unavailable/);
  assert.equal(optionalCalled, false);
});
