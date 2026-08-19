import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapBackground } from "../src/core/background-bootstrap.js";

function validOptions(overrides = {}) {
  return {
    startCore: () => ({ dispose() {} }),
    installMandatoryRecovery: () => ({ dispose() {} }),
    ...overrides
  };
}

test("bootstrapBackground rejects option accessors without invoking them or starting core", () => {
  let reads = 0;
  let starts = 0;
  const options = {
    installMandatoryRecovery() {}
  };
  Object.defineProperty(options, "startCore", {
    enumerable: true,
    get() {
      reads += 1;
      return () => { starts += 1; };
    }
  });
  assert.throws(() => bootstrapBackground(options), /Background bootstrap options/);
  assert.equal(reads, 0);
  assert.equal(starts, 0);
});

test("bootstrapBackground rejects unknown fields, arrays, and custom prototypes", () => {
  assert.throws(() => bootstrapBackground({ ...validOptions(), telemetry: true }), /Background bootstrap options/);
  assert.throws(() => bootstrapBackground([]), /Background bootstrap options/);
  assert.throws(() => bootstrapBackground(Object.assign(Object.create({ inherited: true }), validOptions())), /Background bootstrap options/);
});

test("bootstrapBackground validates logger before startup", () => {
  let starts = 0;
  const options = validOptions({ startCore: () => { starts += 1; return {}; }, logger: {} });
  assert.throws(() => bootstrapBackground(options), /logger must provide warn/);
  assert.equal(starts, 0);
});

test("bootstrapBackground keeps reviewed defaults and coordinated teardown", async () => {
  const events = [];
  const result = bootstrapBackground({
    startCore: () => ({ dispose() { events.push("core"); } }),
    installMandatoryRecovery: () => ({ dispose() { events.push("mandatory"); } })
  });
  assert.equal(Object.getPrototypeOf(result.features), null);
  assert.deepEqual({ ...result.features }, {});
  await result.disposeBackground();
  assert.deepEqual(events, ["mandatory", "core"]);
});
