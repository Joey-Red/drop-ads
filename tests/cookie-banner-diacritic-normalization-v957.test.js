import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("bounded action normalization folds Latin diacritics deterministically before exact matching", () => {
  assert.match(source, /value\.length > MAX_COOKIE_BANNER_TEXT_CHARS/);
  assert.match(source, /\.normalize\("NFKD"\)/);
  assert.match(source, /replace\(\/\[\\u0300-\\u036f\]\/g, ""\)/);
  assert.match(source, /replace\(\/\[\^a-z0-9' -\]\+\/g, " "\)/);
  assert.match(source, /if \(text === phrase\) return score/);
  assert.doesNotMatch(source, /locale|navigator\.language|languages|Intl\./i);
});
