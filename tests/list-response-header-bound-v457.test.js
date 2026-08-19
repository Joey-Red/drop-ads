import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MAX_REMOTE_RESPONSE_HEADER_CHARS } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M457 remote response header values are bounded before parsing work", () => {
  assert.equal(MAX_REMOTE_RESPONSE_HEADER_CHARS, 8_192);
  assert.match(source, /if \(value\.length > MAX_REMOTE_RESPONSE_HEADER_CHARS\)/);
  const bound = source.indexOf("value.length > MAX_REMOTE_RESPONSE_HEADER_CHARS");
  const mediaSplit = source.indexOf('raw.split(";", 1)', bound);
  const contentLengthTrim = source.indexOf("raw.trim()", bound);
  assert.ok(bound >= 0);
  assert.ok(mediaSplit > bound);
  assert.ok(contentLengthTrim > bound);
});

test("M457 missing headers remain supported and present values remain primitive strings", () => {
  assert.match(source, /if \(value == null\) return null;/);
  assert.match(source, /if \(typeof value !== "string"\) throw new TypeError/);
});
