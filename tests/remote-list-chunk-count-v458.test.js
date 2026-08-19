import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M458 remote streams have an explicit nonterminal chunk-work ceiling", () => {
  assert.match(source, /export const MAX_REMOTE_LIST_CHUNKS = 65_536;/);
  assert.match(source, /let chunkCount = 0;/);
  assert.match(source, /chunkCount \+= 1;\s*if \(chunkCount > MAX_REMOTE_LIST_CHUNKS\) \{\s*await cancelQuietly\(readerOperations\.cancel\);\s*throw new Error\("Remote list body contains too many chunks"\);/s);
});

test("M458 chunk counting happens only after a nonterminal reader result is admitted", () => {
  const resultIndex = source.indexOf("const { done, value } = result;");
  const terminalIndex = source.indexOf("if (done) break;", resultIndex);
  const countIndex = source.indexOf("chunkCount += 1;", terminalIndex);
  const byteIndex = source.indexOf("byteLength += intrinsicUint8ArrayByteLength(chunk);", countIndex);
  assert.ok(resultIndex >= 0 && terminalIndex > resultIndex);
  assert.ok(countIndex > terminalIndex);
  assert.ok(byteIndex > countIndex);
});
