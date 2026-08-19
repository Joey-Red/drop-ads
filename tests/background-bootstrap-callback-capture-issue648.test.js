import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground } from "../src/core/background-bootstrap.js";

test("bootstrap warning capture never consults callback-owned bind", async () => {
  let bindReads = 0;
  const warnings = [];
  function warn(...args) { warnings.push(args); }
  Object.defineProperty(warn, "bind", {
    configurable: true,
    get() {
      bindReads += 1;
      throw new Error("callback-owned bind must not be read");
    }
  });

  const registration = bootstrapBackground({
    startCore: () => ({ dispose() {} }),
    installMandatoryRecovery: () => ({ dispose() {} }),
    optionalFeatures: [{
      name: "expected-failure",
      install() { throw new Error("boom"); }
    }],
    logger: { warn }
  });

  assert.equal(bindReads, 0);
  assert.equal(registration.features["expected-failure"], "failed");
  assert.equal(warnings.length, 1);
  await registration.disposeBackground();
  assert.equal(bindReads, 0);
});
