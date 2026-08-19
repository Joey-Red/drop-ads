import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner consent context clamps raw fields before normalization", () => {
  assert.match(source, /const MAX_CONSENT_CONTEXT_CHARS = 1_200/);
  assert.match(source, /const MAX_CONSENT_RAW_FIELD_CHARS = 2_400/);
  assert.match(source, /const normalized = value\.slice\(0, MAX_CONSENT_RAW_FIELD_CHARS\)\.replace\(\/\\s\+\/g, " "\)\.trim\(\)/);
  assert.match(source, /while \(visited < MAX_CONSENT_TEXT_NODES && total < MAX_CONSENT_CONTEXT_CHARS\)/);
  assert.match(source, /append\(nodeValue\(node\)\)/);
  assert.doesNotMatch(source, /node\.nodeValue|document\.createTreeWalker\(/);
});
