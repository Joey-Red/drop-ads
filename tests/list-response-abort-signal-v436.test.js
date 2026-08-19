import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M436 response reads capture abort-signal collaborators before body streaming", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
  assert.match(source, /addAbortListener: capturedReceiverCall/);
  assert.match(source, /removeAbortListener: capturedReceiverCall/);
  assert.match(source, /if \(signalCollaborators\.getAborted\(\)\) throw new Error\("List download timed out"\)/);
});

test("M436 abort-listener teardown is best effort", () => {
  assert.match(source, /try \{ signalCollaborators\.removeAbortListener\("abort", onAbort\); \}/);
  assert.match(source, /listener cleanup is best effort and must not replace the read outcome/);
});
