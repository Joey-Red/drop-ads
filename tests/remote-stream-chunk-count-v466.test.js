import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MAX_REMOTE_LIST_CHUNKS } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M466 streamed remote-list fragmentation has an explicit reviewed ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_CHUNKS, 65_536);
  assert.match(source, /let chunkCount = 0;/);
  assert.match(source, /chunkCount \+= 1;\s*if \(chunkCount > MAX_REMOTE_LIST_CHUNKS\) \{\s*await cancelQuietly\(readerOperations\.cancel\);\s*throw new Error\("Remote list body contains too many chunks"\);\s*\}/s);
});

test("M466 chunk overflow is checked before byte accounting and decoder work", () => {
  const countIndex = source.indexOf("chunkCount += 1;");
  const byteIndex = source.indexOf("byteLength += intrinsicUint8ArrayByteLength(chunk);");
  const decodeIndex = source.indexOf("text += decodeUtf8Chunk(decoder, chunk, { stream: true });");
  assert.ok(countIndex >= 0 && byteIndex > countIndex && decodeIndex > byteIndex);
});
