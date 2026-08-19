import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M434 captures response body/text collaborators through native-compatible boundaries", () => {
  assert.match(source, /function captureNativeCompatibleMethod\(receiver, key, label, nativeConstructor, required = false\)/);
  assert.match(source, /function captureResponseBodyCollaborators\(response\) \{/);
  assert.match(source, /const bodyField = nativeResponseField\(response, "body"\)/);
  assert.match(source, /captureNativeCompatibleMethod\(body, "getReader", "Remote list response body getReader", globalThis\.ReadableStream, false\)/);
  assert.match(source, /captureNativeCompatibleMethod\(response, "text", "Remote list response text", globalThis\.Response, false\)/);
});

test("M434 bounded body reading uses only captured collaborators", () => {
  assert.match(source, /const bodyCollaborators = captureResponseBodyCollaborators\(response\);/);
  assert.match(source, /const reader = bodyCollaborators\.getReader \? bodyCollaborators\.getReader\(\) : null;/);
  assert.match(source, /const text = await bodyCollaborators\.text\(\);/);
  assert.doesNotMatch(source, /response\.body\?\.getReader/);
  assert.doesNotMatch(source, /await response\.text\(\)/);
});
