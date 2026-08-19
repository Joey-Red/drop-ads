import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

function textResponse(text = "ok") {
  return {
    headers: { get() { return null; } },
    body: null,
    async text() { return text; }
  };
}

test("M439 synthetic abort-signal accessors are rejected without getter execution", async () => {
  let getterCalls = 0;
  const signal = {};
  Object.defineProperty(signal, "aborted", {
    enumerable: true,
    get() { getterCalls += 1; return false; }
  });
  await assert.rejects(
    () => readResponseTextBounded(textResponse(), 16, { signal }),
    /Synthetic abort signal aborted must be an own enumerable boolean data field/
  );
  assert.equal(getterCalls, 0);
});

test("M439 abort event methods are captured once and receiver-bound", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /addAbortListener: capturedReceiverCall\(addDescriptor\.value, signal\)/);
  assert.match(source, /removeAbortListener: capturedReceiverCall\(removeDescriptor\.value, signal\)/);
  assert.match(source, /addAbortListener: addField\.present \? capturedReceiverCall\(addField\.value, signal\) : null/);
  assert.match(source, /removeAbortListener: removeField\.present \? capturedReceiverCall\(removeField\.value, signal\) : null/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
});
