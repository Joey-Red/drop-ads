import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M440 accepts genuine Map registration stores", () => {
  const registrations = new Map();
  const status = installOptionalBackgroundFeatures([
    { name: "feature", install: () => ({ dispose() {} }) }
  ], { registrations });
  assert.equal(status.feature, "installed");
  assert.equal(typeof Reflect.apply(Map.prototype.get, registrations, ["feature"])?.dispose, "function");
});

test("M440 rejects fake and revoked registration maps deterministically", () => {
  assert.throws(
    () => installOptionalBackgroundFeatures([], { registrations: { set() {}, has() {} } }),
    /registrations must be a Map/
  );
  const { proxy, revoke } = Proxy.revocable(new Map(), {});
  revoke();
  assert.throws(
    () => installOptionalBackgroundFeatures([], { registrations: proxy }),
    /registrations must be a Map/
  );
});
