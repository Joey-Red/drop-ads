import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const logger = { warn() {} };
const features = [{
  name: "sample",
  install() {
    return { dispose() {} };
  }
}];

test("genuine registration Maps use intrinsic set without reading a poisoned own method", () => {
  const registrations = new Map();
  Object.defineProperty(registrations, "set", {
    configurable: true,
    get() { throw new Error("poisoned set getter must not run"); }
  });
  const status = installOptionalBackgroundFeatures(features, { logger, core: {}, registrations });
  assert.equal(status.sample, "installed");
  assert.equal(Map.prototype.has.call(registrations, "sample"), true);
});

test("fake and revoked registration maps fail deterministic admission", () => {
  assert.throws(
    () => installOptionalBackgroundFeatures(features, { logger, core: {}, registrations: {} }),
    /registrations must be a Map/
  );
  const revoked = Proxy.revocable(new Map(), {});
  revoked.revoke();
  assert.throws(
    () => installOptionalBackgroundFeatures(features, { logger, core: {}, registrations: revoked.proxy }),
    /registrations must be a Map/
  );
});
