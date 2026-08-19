import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MAX_REMOTE_LIST_CHUNKS } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M458 uses an explicit generous streamed chunk-count ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_CHUNKS, 65_536);
  assert.match(source, /let chunkCount = 0;/);
  assert.match(source, /chunkCount \+= 1;/);
  assert.match(source, /if \(chunkCount > MAX_REMOTE_LIST_CHUNKS\) \{\s*await cancelQuietly\(readerOperations\.cancel\);\s*throw new Error\("Remote list body contains too many chunks"\);/s);
});

test("M458 counts only after a nonterminal byte chunk passes result admission", () => {
  const resultIndex = source.indexOf("streamedReaderResultSnapshot(await readerOperations.read())");
  const doneIndex = source.indexOf("if (done) break;", resultIndex);
  const countIndex = source.indexOf("chunkCount += 1;", doneIndex);
  const decodeIndex = source.indexOf("decodeUtf8Chunk(decoder, chunk", countIndex);
  assert.ok(resultIndex >= 0 && doneIndex > resultIndex && countIndex > doneIndex && decodeIndex > countIndex);
});
