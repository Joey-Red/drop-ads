import test from "node:test";
import assert from "node:assert/strict";
import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

const type = "drop-ads:refresh-lists";

test("M420 omitted refresh force remains valid", () => {
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type }, "core"),
    { handled: true, type }
  );
});

test("M420 present refresh force must be a primitive boolean", () => {
  for (const force of [null, undefined, 0, 1, "false", new Boolean(false), {}, []]) {
    assert.throws(
      () => validateBackgroundRuntimeMessage({ type, force }, "core"),
      /force must be boolean/
    );
  }

  assert.deepEqual(validateBackgroundRuntimeMessage({ type, force: false }, "core"), { handled: true, type });
  assert.deepEqual(validateBackgroundRuntimeMessage({ type, force: true }, "core"), { handled: true, type });
});

test("M420 hostile force values are rejected without coercion", () => {
  let conversions = 0;
  const force = {
    valueOf() { conversions += 1; return true; },
    toString() { conversions += 1; return "true"; }
  };

  assert.throws(() => validateBackgroundRuntimeMessage({ type, force }, "core"), /force must be boolean/);
  assert.equal(conversions, 0);
});
