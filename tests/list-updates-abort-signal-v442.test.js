import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M442 response reads capture abort-signal operations before body work", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\) \{/);
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);\s*const bodyCollaborators = captureResponseBodyCollaborators\(response\);/s);
  assert.match(source, /signalCollaborators\.addAbortListener\("abort", onAbort, \{ once: true \}\)/);
  assert.match(source, /if \(signalCollaborators\.getAborted\(\)\) throw new Error\("List download timed out"\)/);
});

test("M442 abort-listener teardown is best effort and direct optional-chained signal reads are gone", () => {
  assert.match(source, /try \{ signalCollaborators\.removeAbortListener\("abort", onAbort\); \}\s*catch \{ \/\* listener cleanup is best effort/s);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
});
