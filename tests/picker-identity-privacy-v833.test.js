import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");
assert.match(source, /if \(\/\[\/\?#@=&%\]\/\.test\(value\)\) return null/);
assert.match(source, /\\u034f/);
assert.match(source, /\\u200b-\\u200f/);
assert.match(source, /\\ufeff/);
