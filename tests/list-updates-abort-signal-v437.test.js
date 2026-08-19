import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

function responseWithText(text) {
  return {
    body: null,
    headers: { get() { return null; } },
    async text() { return text; }
  };
}

test("M437 synthetic abort signal accessors are rejected without getter execution", async () => {
  let getterCalls = 0;
  const signal = {};
  Object.defineProperty(signal, "aborted", {
    enumerable: true,
    get() { getterCalls += 1; return false; }
  });
  await assert.rejects(
    () => readResponseTextBounded(responseWithText("||ads.example^\n"), 1024, { signal }),
    /Synthetic abort signal aborted must be an own enumerable boolean data field/
  );
  assert.equal(getterCalls, 0);
});

test("M437 reader loop uses captured abort collaborators rather than ordinary signal reads", () => {
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
  assert.match(source, /if \(signalCollaborators\.getAborted\(\)\) throw new Error\("List download timed out"\);/);
  assert.match(source, /signalCollaborators\.addAbortListener\("abort", onAbort, \{ once: true \}\)/);
  assert.match(source, /signalCollaborators\.removeAbortListener\("abort", onAbort\)/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
});
