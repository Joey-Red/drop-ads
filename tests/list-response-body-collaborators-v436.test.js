import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M436 remote response body collaborators are captured once with native compatibility", () => {
  assert.match(source, /function captureNativeCompatibleMethod\(receiver, key, label, nativeConstructor, required = false\)/);
  assert.match(source, /function captureResponseBodyCollaborators\(response\)/);
  assert.match(source, /nativeResponseField\(response, "body"\)/);
  assert.match(source, /captureNativeCompatibleMethod\(body, "getReader", "Remote list response body getReader", globalThis\.ReadableStream, false\)/);
  assert.match(source, /captureNativeCompatibleMethod\(response, "text", "Remote list response text", globalThis\.Response, false\)/);
});

test("M436 body parsing consumes captured callbacks rather than rereading response methods", () => {
  assert.match(source, /const bodyCollaborators = captureResponseBodyCollaborators\(response\);/);
  assert.match(source, /const reader = bodyCollaborators\.getReader \? bodyCollaborators\.getReader\(\) : null;/);
  assert.match(source, /await bodyCollaborators\.text\(\)/);
  assert.doesNotMatch(source, /response\.body\?\.getReader/);
  assert.doesNotMatch(source, /await response\.text\(\)/);
});
