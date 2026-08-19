import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

const noHeaders = Object.freeze({ headersGet: () => null });

test("synthetic response body accessors fail closed without executing the getter", async () => {
  let getterCalls = 0;
  const response = { text: async () => "fallback" };
  Object.defineProperty(response, "body", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return null;
    }
  });

  await assert.rejects(
    readResponseTextBounded(response, 1024, noHeaders),
    /response body must be an own enumerable data field/i
  );
  assert.equal(getterCalls, 0);
});

test("synthetic body getReader and response text collaborators must be own data functions", async () => {
  let getReaderGetterCalls = 0;
  const body = {};
  Object.defineProperty(body, "getReader", {
    enumerable: true,
    get() {
      getReaderGetterCalls += 1;
      return () => null;
    }
  });
  const response = { body, text: async () => "fallback" };

  await assert.rejects(
    readResponseTextBounded(response, 1024, noHeaders),
    /body getReader must be an own enumerable data function/i
  );
  assert.equal(getReaderGetterCalls, 0);

  let textGetterCalls = 0;
  const badText = { body: null };
  Object.defineProperty(badText, "text", {
    enumerable: true,
    get() {
      textGetterCalls += 1;
      return async () => "bad";
    }
  });
  await assert.rejects(
    readResponseTextBounded(badText, 1024, noHeaders),
    /response text must be an own enumerable data function/i
  );
  assert.equal(textGetterCalls, 0);
});

test("native Response body collaborators remain compatible", async () => {
  if (typeof Response !== "function") return;
  const response = new Response("example.test\n");
  assert.equal(await readResponseTextBounded(response, 1024), "example.test\n");
});
