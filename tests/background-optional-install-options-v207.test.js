import assert from "node:assert/strict";
import test from "node:test";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const features = [{ name: "one", install() { return { dispose() {} }; } }];

test("optional installer options reject accessors without invoking installers", () => {
  let reads = 0;
  let installs = 0;
  const guardedFeatures = [{ name: "one", install() { installs += 1; } }];
  const options = {};
  Object.defineProperty(options, "logger", {
    enumerable: true,
    get() {
      reads += 1;
      return console;
    }
  });
  assert.throws(() => installOptionalBackgroundFeatures(guardedFeatures, options), /install options/);
  assert.equal(reads, 0);
  assert.equal(installs, 0);
});

test("optional installer options reject unknown fields and invalid logger before install", () => {
  let installs = 0;
  const guardedFeatures = [{ name: "one", install() { installs += 1; } }];
  assert.throws(() => installOptionalBackgroundFeatures(guardedFeatures, { tracking: false }), /install options/);
  assert.throws(() => installOptionalBackgroundFeatures(guardedFeatures, { logger: {} }), /logger must provide warn/);
  assert.equal(installs, 0);
});

test("optional installer registrations must be a Map when supplied", () => {
  assert.throws(() => installOptionalBackgroundFeatures(features, { registrations: {} }), /registrations must be a Map/);
  const registrations = new Map();
  const status = installOptionalBackgroundFeatures(features, { registrations });
  assert.equal(status.one, "installed");
  assert.equal(typeof registrations.get("one")?.dispose, "function");
});

test("optional installer defaults remain valid", () => {
  const status = installOptionalBackgroundFeatures([]);
  assert.equal(Object.getPrototypeOf(status), null);
  assert.deepEqual({ ...status }, {});
});
