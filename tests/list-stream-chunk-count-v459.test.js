import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MAX_REMOTE_LIST_CHUNKS } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M459 exposes a reviewed finite nonterminal stream chunk ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_CHUNKS, 65_536);
  assert.match(source, /chunkCount \+= 1;/);
  assert.match(source, /if \(chunkCount > MAX_REMOTE_LIST_CHUNKS\) \{/);
  assert.match(source, /await cancelQuietly\(readerOperations\.cancel\);\s*throw new Error\("Remote list body contains too many chunks"\);/s);
});

test("M459 counts admitted nonterminal chunks before byte/decode processing", () => {
  const countAt = source.indexOf("chunkCount += 1;");
  const lengthAt = source.indexOf("intrinsicUint8ArrayByteLength(chunk)", countAt);
  const decodeAt = source.indexOf("decodeUtf8Chunk(decoder, chunk", countAt);
  assert.ok(countAt >= 0);
  assert.ok(lengthAt > countAt);
  assert.ok(decodeAt > lengthAt);
});
