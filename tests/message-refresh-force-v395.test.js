import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function installCoreGuard() {
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
  guarded.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse({
      ok: true,
      force: Object.hasOwn(message, "force") ? message.force : "omitted"
    });
    return true;
  });
  return (message) => {
    let response = null;
    const handled = wrapped(message, {}, (value) => { response = value; });
    return { handled, response };
  };
}

test("M395 refresh force omission remains valid and non-forced", () => {
  const send = installCoreGuard();
  assert.deepEqual(send({ type: "drop-ads:refresh-lists" }), {
    handled: true,
    response: { ok: true, force: "omitted" }
  });
});

test("M395 refresh force accepts only an explicitly primitive boolean", () => {
  const send = installCoreGuard();
  for (const force of [false, true]) {
    const result = send({ type: "drop-ads:refresh-lists", force });
    assert.equal(result.handled, true);
    assert.deepEqual(result.response, { ok: true, force });
  }

  for (const force of [null, undefined, 0, 1, "false", new Boolean(false), {}, new Proxy({}, {})]) {
    const result = send({ type: "drop-ads:refresh-lists", force });
    assert.equal(result.handled, true);
    assert.equal(result.response.ok, false);
    assert.match(result.response.error, /force must be boolean/);
  }
});
