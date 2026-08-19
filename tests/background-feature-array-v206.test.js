import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapBackground, installOptionalBackgroundFeatures, MAX_OPTIONAL_BACKGROUND_FEATURES } from "../src/core/background-bootstrap.js";

function feature(name, install = () => undefined) {
  return { name, install };
}

test("optional feature registries reject holes and accessor indices without getter execution", () => {
  const sparse = new Array(1);
  assert.throws(() => installOptionalBackgroundFeatures(sparse), /enumerable data entries/);

  let reads = 0;
  const accessor = [feature("one")];
  Object.defineProperty(accessor, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return feature("one");
    }
  });
  assert.throws(() => installOptionalBackgroundFeatures(accessor), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("optional feature registries reject extra properties and one-over length", () => {
  const extra = [feature("one")];
  extra.note = true;
  assert.throws(() => installOptionalBackgroundFeatures(extra), /enumerable data entries/);

  const exact = Array.from({ length: MAX_OPTIONAL_BACKGROUND_FEATURES }, (_, index) => feature(`f${index}`));
  assert.doesNotThrow(() => installOptionalBackgroundFeatures(exact));
  assert.throws(
    () => installOptionalBackgroundFeatures([...exact, feature("overflow")]),
    new RegExp(String(MAX_OPTIONAL_BACKGROUND_FEATURES))
  );
});

test("bootstrap validates the detached feature sequence before core startup", () => {
  let starts = 0;
  const features = [feature("one")];
  Object.defineProperty(features, "0", { enumerable: true, get() { return feature("one"); } });
  assert.throws(() => bootstrapBackground({
    startCore() { starts += 1; return {}; },
    installMandatoryRecovery() {},
    optionalFeatures: features
  }), /enumerable data entries/);
  assert.equal(starts, 0);
});
