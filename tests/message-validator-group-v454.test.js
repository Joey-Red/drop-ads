import test from "node:test";
import assert from "node:assert/strict";

import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

test("M454 rejects invalid direct validation groups before message inspection", () => {
  let typeReads = 0;
  const message = {};
  Object.defineProperty(message, "type", {
    enumerable: true,
    get() {
      typeReads += 1;
      return "drop-ads:get-ui-state";
    }
  });

  assert.throws(() => validateBackgroundRuntimeMessage(message, "other"), /Message guard group is invalid/);
  assert.equal(typeReads, 0);
  assert.throws(() => validateBackgroundRuntimeMessage({}, new String("core")), /Message guard group is invalid/);
});

test("M454 preserves cross-group handled false behavior", () => {
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:get-cosmetic-policy" }, "core"),
    { handled: false, type: "drop-ads:get-cosmetic-policy" }
  );
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:get-ui-state" }, "cosmetic"),
    { handled: false, type: "drop-ads:get-ui-state" }
  );
});
