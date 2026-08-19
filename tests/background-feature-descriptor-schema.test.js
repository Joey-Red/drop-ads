import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature descriptors reject unknown, hidden, symbol, and custom-prototype fields", () => {
  assert.throws(() => installOptionalBackgroundFeatures([{ name: "extra", install() {}, history: [] }]), /unsupported field: history/);

  const hidden = { name: "hidden", install() {} };
  Object.defineProperty(hidden, "history", { enumerable: false, value: [] });
  assert.throws(() => installOptionalBackgroundFeatures([hidden]), /unsupported field: history/);

  const symbol = { name: "symbol", install() {} };
  symbol[Symbol("history")] = [];
  assert.throws(() => installOptionalBackgroundFeatures([symbol]), /unsupported symbol field/);

  const inherited = Object.create({ history: [] });
  inherited.name = "inherited";
  inherited.install = () => undefined;
  assert.throws(() => installOptionalBackgroundFeatures([inherited]), /plain object/);
});

test("optional feature descriptor accessors are rejected without invoking them", () => {
  let getterCalls = 0;
  const descriptor = { name: "accessor" };
  Object.defineProperty(descriptor, "install", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => undefined;
    }
  });

  assert.throws(() => installOptionalBackgroundFeatures([descriptor]), /install must be a data field/);
  assert.equal(getterCalls, 0);
});

test("malformed optional descriptors fail before mandatory startup side effects", () => {
  let coreStarts = 0;
  let recoveryInstalls = 0;

  assert.throws(() => bootstrapBackground({
    startCore() {
      coreStarts += 1;
      return {};
    },
    installMandatoryRecovery() {
      recoveryInstalls += 1;
    },
    optionalFeatures: [{ name: "bad", install() {}, pageHistory: [] }]
  }), /unsupported field: pageHistory/);

  assert.equal(coreStarts, 0);
  assert.equal(recoveryInstalls, 0);
});

test("valid optional feature descriptors preserve install and teardown behavior", async () => {
  const events = [];
  const bootstrap = bootstrapBackground({
    startCore: () => ({ id: "core" }),
    installMandatoryRecovery: () => { events.push("recovery"); },
    optionalFeatures: [{
      name: "feature",
      install(core) {
        events.push(`install:${core.id}`);
        return { dispose() { events.push("dispose"); } };
      }
    }]
  });

  assert.equal(bootstrap.features.feature, "installed");
  await bootstrap.disposeOptionalFeatures();
  assert.deepEqual(events, ["recovery", "install:core", "dispose"]);
});
