import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 response body and fallback collaborators are captured once", () => {
  assert.match(source, /function captureResponseBodyCollaborators\(response\)/);
  assert.match(source, /nativeResponseField\(response, "body"\)/);
  assert.match(source, /captureNativeCompatibleMethod\(body, "getReader"/);
  assert.match(source, /captureNativeCompatibleMethod\(response, "text"/);
  assert.match(source, /return Object\.freeze\(\{ getReader, text \}\);/);
});

test("M438 response body consumption uses only captured collaborators", () => {
  assert.match(source, /const bodyCollaborators = captureResponseBodyCollaborators\(response\);/);
  assert.match(source, /bodyCollaborators\.getReader \? bodyCollaborators\.getReader\(\) : null/);
  assert.match(source, /await bodyCollaborators\.text\(\)/);
  assert.doesNotMatch(source, /response\.body\?\.getReader/);
  assert.doesNotMatch(source, /await response\.text\(\)/);
});
