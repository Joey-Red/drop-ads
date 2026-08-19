import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const logger = { warn() {} };
const feature = Object.freeze({
  name: "capture",
  install() { return { dispose() {} }; }
});

test("M441 accepts genuine Map and Map subclass registration stores", () => {
  class RegistrationMap extends Map {}
  for (const registrations of [new Map(), new RegistrationMap()]) {
    const status = installOptionalBackgroundFeatures([feature], { logger, registrations });
    assert.equal(status.capture, "installed");
    assert.equal(registrations.has("capture"), true);
    assert.equal(typeof registrations.get("capture").dispose, "function");
  }
});

test("M441 rejects fake, proxied, and revoked Map collaborators before install", () => {
  let installs = 0;
  const countedFeature = Object.freeze({
    name: "counted",
    install() { installs += 1; return null; }
  });
  const proxiedMap = new Proxy(new Map(), {});
  const { proxy: revokedMap, revoke } = Proxy.revocable(new Map(), {});
  revoke();

  for (const registrations of [{}, proxiedMap, revokedMap]) {
    assert.throws(
      () => installOptionalBackgroundFeatures([countedFeature], { logger, registrations }),
      /registrations must be a Map/
    );
  }
  assert.equal(installs, 0);
});
