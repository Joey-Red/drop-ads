import test from "node:test";
import assert from "node:assert/strict";

import { validateListMetadata } from "../src/core/lists.js";

function metadata(schemaVersion) {
  return {
    schemaVersion,
    id: "drop-ads-default",
    title: "Drop Ads default",
    format: "drop-ads-v1"
  };
}

test("M454 accepts only the exact safe-integer native schema version", () => {
  assert.equal(validateListMetadata(metadata(1)).schemaVersion, 1);
  for (const value of [0, 2, 1.5, Number.NaN, Number.POSITIVE_INFINITY, new Number(1)]) {
    assert.throws(() => validateListMetadata(metadata(value)), /Unsupported list schema version/);
  }
});

test("M454 rejected version objects are never coerced for diagnostics", () => {
  let conversions = 0;
  const hostile = {
    valueOf() { conversions += 1; return 1; },
    toString() { conversions += 1; return "1"; },
    [Symbol.toPrimitive]() { conversions += 1; return 1; }
  };

  assert.throws(
    () => validateListMetadata(metadata(hostile)),
    (error) => error instanceof Error && error.message === "Unsupported list schema version"
  );
  assert.equal(conversions, 0);
});
