import test from "node:test";
import assert from "node:assert/strict";

import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

const validate = (message) => validateBackgroundRuntimeMessage(message, "core");

test("M426 admits canonical set-site-disabled true and false messages", () => {
  assert.deepEqual(validate({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled: true }), { handled: true, type: "drop-ads:set-site-disabled" });
  assert.deepEqual(validate({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled: false }), { handled: true, type: "drop-ads:set-site-disabled" });
});

test("M426 rejects type-confused disabled values and invalid domains", () => {
  for (const disabled of ["true", 1, 0, null, undefined, new Boolean(true), {}]) {
    assert.throws(() => validate({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled }), /disabled must be boolean/);
  }
  assert.throws(() => validate({ type: "drop-ads:set-site-disabled", domain: "not a domain", disabled: true }));
});

test("M426 preserves the exact message schema", () => {
  assert.throws(() => validate({ type: "drop-ads:set-site-disabled", domain: "example.com", disabled: true, extra: true }));
  assert.throws(() => validate({ type: "drop-ads:set-site-disabled", disabled: true }));
});
