import test from "node:test";
import assert from "node:assert/strict";
import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

test("M426 set-site-disabled admits canonical domain plus primitive boolean", () => {
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled: true }, "core"),
    { handled: true, type: "drop-ads:set-site-disabled" }
  );
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled: false }, "core"),
    { handled: true, type: "drop-ads:set-site-disabled" }
  );
});

test("M426 set-site-disabled rejects type-confused disabled values and invalid domains", () => {
  for (const disabled of ["true", 1, 0, null, {}, new Boolean(true)]) {
    assert.throws(
      () => validateBackgroundRuntimeMessage({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled }, "core"),
      /disabled must be boolean/
    );
  }
  assert.throws(
    () => validateBackgroundRuntimeMessage({ type: "drop-ads:set-site-disabled", domain: "bad domain", disabled: true }, "core")
  );
});
