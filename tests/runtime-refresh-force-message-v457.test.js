import test from "node:test";
import assert from "node:assert/strict";

import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

function validate(message) {
  return validateBackgroundRuntimeMessage(message, "core");
}

test("M457 refresh force omission and primitive booleans remain valid", () => {
  assert.deepEqual(validate({ type: "drop-ads:refresh-lists" }), {
    handled: true,
    type: "drop-ads:refresh-lists"
  });
  for (const force of [false, true]) {
    assert.deepEqual(validate({ type: "drop-ads:refresh-lists", force }), {
      handled: true,
      type: "drop-ads:refresh-lists"
    });
  }
});

test("M457 explicitly present non-boolean refresh force values fail", () => {
  for (const force of [null, undefined, "false", 0, 1, new Boolean(false), {}]) {
    assert.throws(
      () => validate({ type: "drop-ads:refresh-lists", force }),
      /force must be boolean/
    );
  }
});
