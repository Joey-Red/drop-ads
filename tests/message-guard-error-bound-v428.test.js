import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createMessageGuardedApi,
  MAX_RUNTIME_MESSAGE_ERROR_CHARS
} from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

function makeApi() {
  let wrapper;
  return {
    api: { runtime: { onMessage: { addListener(listener) { wrapper = listener; }, removeListener() {} } } },
    fire(message, sendResponse) { return wrapper(message, {}, sendResponse); }
  };
}

test("M428 guarded validation failure text is bounded and response delivery is best effort", () => {
  const harness = makeApi();
  const guarded = createMessageGuardedApi(harness.api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);
  let response;
  const handled = harness.fire({ type: "drop-ads:set-enabled", enabled: "yes" }, (value) => { response = value; });
  assert.equal(handled, true);
  assert.equal(response.ok, false);
  assert.ok(response.error.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS);
  assert.doesNotThrow(() => harness.fire(
    { type: "drop-ads:set-enabled", enabled: "yes" },
    () => { throw new Error("closed channel"); }
  ));
});

test("M428 error detail inspection is descriptor-only and bounded", () => {
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
  assert.match(source, /MAX_RUNTIME_MESSAGE_ERROR_CHARS = 1_024/);
  assert.match(source, /sendResponse\(\{ ok: false, error: guardedErrorText\(error\) \}\)/);
});
