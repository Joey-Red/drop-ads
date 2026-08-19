import assert from "node:assert/strict";
import test from "node:test";

import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

function fixture() {
  let messageListener;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { messageListener = listener; },
        removeListener() {}
      }
    },
    storage: {
      local: { async get() { return {}; } },
      session: { async get() { return {}; } },
      onChanged: { addListener() {}, removeListener() {} }
    },
    tabs: { async query() { return []; } }
  };
  const runtime = installCosmeticRuntime({ api, logger: { warn() {} } });
  return { runtime, listener: () => messageListener };
}

test("cosmetic runtime does not execute type getters", () => {
  const { runtime, listener } = fixture();
  let reads = 0;
  const message = {};
  Object.defineProperty(message, "type", {
    enumerable: true,
    get() {
      reads += 1;
      return "drop-ads:get-cosmetic-policy";
    }
  });
  assert.equal(listener()(message, {}, () => {}), false);
  assert.equal(reads, 0);
  runtime.dispose();
});

test("cosmetic runtime does not execute add/remove payload getters", () => {
  for (const [type, key] of [
    ["drop-ads:add-cosmetic-rule", "rule"],
    ["drop-ads:remove-cosmetic-rule", "key"]
  ]) {
    const { runtime, listener } = fixture();
    let reads = 0;
    const message = { type, field: "personalCosmeticHide" };
    Object.defineProperty(message, key, {
      enumerable: true,
      get() {
        reads += 1;
        return key === "rule" ? { selector: ".ad" } : "x";
      }
    });
    assert.equal(listener()(message, {}, () => {}), false);
    assert.equal(reads, 0);
    runtime.dispose();
  }
});

test("inherited and array message envelopes do not enter cosmetic dispatch", () => {
  const { runtime, listener } = fixture();
  assert.equal(listener()(Object.create({ type: "drop-ads:get-cosmetic-policy" }), {}, () => {}), false);
  assert.equal(listener()(Object.assign([], { type: "drop-ads:get-cosmetic-policy" }), {}, () => {}), false);
  assert.equal(listener()({ type: "drop-ads:unknown" }, {}, () => {}), false);
  runtime.dispose();
});
