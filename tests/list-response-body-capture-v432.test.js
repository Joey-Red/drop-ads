import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function revoked(target) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("M432 synthetic response body/text accessors are rejected without execution", async () => {
  let bodyGetterCalls = 0;
  let textGetterCalls = 0;
  const bodyAccessor = { headers: null };
  Object.defineProperty(bodyAccessor, "body", {
    enumerable: true,
    get() {
      bodyGetterCalls += 1;
      return null;
    }
  });
  Object.defineProperty(bodyAccessor, "text", {
    enumerable: true,
    get() {
      textGetterCalls += 1;
      return async () => "ok";
    }
  });
  await assert.rejects(readResponseTextBounded(bodyAccessor, 16), /response body must be an own enumerable data field/);
  assert.equal(bodyGetterCalls, 0);
  assert.equal(textGetterCalls, 0);
});

test("M432 captured synthetic text keeps receiver and is not reread", async () => {
  let textGetterReads = 0;
  const response = {
    headers: null,
    body: null,
    marker: "ok",
    async text() {
      assert.equal(this, response);
      return this.marker;
    }
  };
  const descriptor = Object.getOwnPropertyDescriptor(response, "text");
  Object.defineProperty(response, "text", {
    enumerable: true,
    configurable: true,
    get() {
      textGetterReads += 1;
      return descriptor.value;
    }
  });
  await assert.rejects(readResponseTextBounded(response, 16), /response text must be an own enumerable data function/);
  assert.equal(textGetterReads, 0);

  Object.defineProperty(response, "text", { enumerable: true, configurable: true, writable: true, value: descriptor.value });
  assert.equal(await readResponseTextBounded(response, 16), "ok");
});

test("M432 revoked synthetic body fails deterministically before body work", async () => {
  await assert.rejects(
    readResponseTextBounded({ headers: null, body: revoked({}), text: async () => "fallback" }, 16),
    /getReader receiver is not safely inspectable/
  );
});
