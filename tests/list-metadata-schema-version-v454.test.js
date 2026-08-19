import test from "node:test";
import assert from "node:assert/strict";
import { LIST_SCHEMA_VERSION, NATIVE_LIST_FORMAT, validateListMetadata } from "../src/core/lists.js";

function metadata(schemaVersion = LIST_SCHEMA_VERSION) {
  return { schemaVersion, id: "baseline", title: "Baseline", format: NATIVE_LIST_FORMAT };
}

test("M454 accepts only the canonical safe-integer list schema version", () => {
  assert.equal(validateListMetadata(metadata()).schemaVersion, LIST_SCHEMA_VERSION);
  for (const value of [0, 2, 1.5, Number.NaN, Number.POSITIVE_INFINITY, new Number(1), "1", true]) {
    assert.throws(() => validateListMetadata(metadata(value)), /Unsupported list schema version/);
  }
});

test("M454 schema-version rejection never coerces caller values", () => {
  let conversions = 0;
  const hostile = {
    toString() { conversions += 1; throw new Error("must not stringify"); },
    valueOf() { conversions += 1; throw new Error("must not coerce"); },
    [Symbol.toPrimitive]() { conversions += 1; throw new Error("must not coerce"); }
  };
  assert.throws(() => validateListMetadata(metadata(hostile)), /^Error: Unsupported list schema version$/);
  assert.equal(conversions, 0);
});
