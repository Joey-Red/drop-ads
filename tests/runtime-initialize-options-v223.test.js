import assert from "node:assert/strict";
import test from "node:test";

import { createBackgroundRuntime } from "../src/core/runtime.js";
import { createRuntimeApiShell } from "./helpers/runtime-api-shell.js";

function fixture() {
  const calls = [];
  const api = createRuntimeApiShell({
    contextMenus: {
      async removeAll() {
        calls.push("removeAll");
        throw new Error("after-validation");
      },
      create() {}
    }
  });
  return { calls, controller: createBackgroundRuntime({ api }) };
}

test("runtime initialization rejects repairState accessors without invoking them", async () => {
  const { calls, controller } = fixture();
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "repairState", {
    enumerable: true,
    get() {
      reads += 1;
      return true;
    }
  });
  await assert.rejects(controller.initializeRuntime(options), /Runtime initialization options/);
  assert.equal(reads, 0);
  assert.deepEqual(calls, []);
});

test("runtime initialization rejects unknown, custom-prototype, and type-confused options before side effects", async () => {
  for (const options of [
    { surprise: true },
    Object.assign(Object.create({ custom: true }), { repairState: false }),
    { repairState: "true" }
  ]) {
    const { calls, controller } = fixture();
    await assert.rejects(controller.initializeRuntime(options));
    assert.deepEqual(calls, []);
  }
});

test("runtime initialization omitted repairState is admitted as false", async () => {
  const { calls, controller } = fixture();
  await assert.rejects(controller.initializeRuntime(), /after-validation/);
  assert.deepEqual(calls, ["removeAll"]);
});
