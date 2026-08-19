import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  createMessageGuardedApi,
  MAX_RUNTIME_MESSAGE_TYPE_CHARS,
  validateBackgroundRuntimeMessage
} from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M398 reviewed type ceiling covers every shipped Drop Ads message literal", () => {
  const types = [...source.matchAll(/"(drop-ads:[a-z0-9:-]+)"/g)].map((match) => match[1]);
  assert.ok(types.length > 0);
  for (const type of types) assert.ok(type.length <= MAX_RUNTIME_MESSAGE_TYPE_CHARS, type);
});

test("M398 direct message validation rejects an over-limit type without echoing it", () => {
  const type = "x".repeat(MAX_RUNTIME_MESSAGE_TYPE_CHARS + 1);
  assert.throws(
    () => validateBackgroundRuntimeMessage({ type }, "core"),
    (error) => error instanceof Error
      && error.message === "Runtime message type is invalid"
      && !error.message.includes(type)
  );
});

test("M398 guard rejects oversized type with bounded static failure text", () => {
  let wrapped = null;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { wrapped = listener; },
        removeListener() {}
      }
    }
  };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);

  let response = null;
  const type = "x".repeat(MAX_RUNTIME_MESSAGE_TYPE_CHARS + 1);
  const handled = wrapped({ type }, {}, (value) => { response = value; });
  assert.equal(handled, true);
  assert.deepEqual(response, {
    ok: false,
    error: "Invalid runtime message: Runtime message type is invalid"
  });
});
