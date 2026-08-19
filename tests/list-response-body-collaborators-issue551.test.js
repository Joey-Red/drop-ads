import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const headersGet = () => null;

test("response text fallback is captured from a synthetic own-data collaborator", async () => {
  let calls = 0;
  const response = {
    body: null,
    text() {
      calls += 1;
      return Promise.resolve("example.com\n");
    }
  };
  assert.equal(await readResponseTextBounded(response, 1024, { headersGet }), "example.com\n");
  assert.equal(calls, 1);
});

test("synthetic response body accessor is rejected without getter execution", async () => {
  let getterCalls = 0;
  const response = { text: async () => "example.com\n" };
  Object.defineProperty(response, "body", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return null;
    }
  });

  await assert.rejects(
    readResponseTextBounded(response, 1024, { headersGet }),
    /response body must be an own enumerable data field/
  );
  assert.equal(getterCalls, 0);
});

test("synthetic body getReader accessor is rejected without getter execution", async () => {
  let getterCalls = 0;
  const body = {};
  Object.defineProperty(body, "getReader", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => null;
    }
  });
  const response = { body, text: async () => "example.com\n" };

  await assert.rejects(
    readResponseTextBounded(response, 1024, { headersGet }),
    /getReader must be an own enumerable data function/
  );
  assert.equal(getterCalls, 0);
});
