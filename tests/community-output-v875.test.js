import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../tools/community-output.mjs", import.meta.url), "utf8");

test("community workflow output accepts only canonical exact result schemas", () => {
  assert.match(source, /const VALIDATION_KEYS = new Set\(\["valid", "status", "candidate", "reason"\]\)/);
  assert.match(source, /const PROMOTION_KEYS = new Set\(\["valid", "status", "candidate", "reason", "changed", "listText"\]\)/);
  assert.match(source, /Reflect\.ownKeys\(object\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(object, key\)/);
  assert.match(source, /COMMUNITY_OUTPUT_STATUSES\.has\(status\)/);
});

test("community output remains single-line and does not emit promoted list text", () => {
  assert.match(source, /\[\\r\\n\\u0000\]/);
  assert.match(source, /MAX_COMMUNITY_OUTPUT_REASON_CHARS = 1_024/);
  assert.match(source, /typeof listText !== "string"/);
  assert.doesNotMatch(source, /`[^`]*listText=\$\{/);
});
