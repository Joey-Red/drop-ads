import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("streamed remote-list bodies have an explicit fragmentation ceiling", () => {
  assert.match(source, /export const MAX_REMOTE_LIST_CHUNKS = 65_536;/);
  assert.match(source, /let chunkCount = 0;/);
  assert.match(source, /chunkCount \+= 1;/);
  assert.match(source, /if \(chunkCount > MAX_REMOTE_LIST_CHUNKS\) \{/);
  assert.match(source, /await cancelQuietly\(readerOperations\.cancel\);\s*throw new Error\("Remote list body contains too many chunks"\);/s);
});

test("chunk overflow is checked before byte/decode processing of the one-over chunk", () => {
  const increment = source.indexOf("chunkCount += 1;");
  const overflow = source.indexOf("chunkCount > MAX_REMOTE_LIST_CHUNKS", increment);
  const byteRead = source.indexOf("intrinsicUint8ArrayByteLength(chunk)", increment);
  const decode = source.indexOf("decodeUtf8Chunk(decoder, chunk", increment);
  assert.ok(increment >= 0 && overflow > increment);
  assert.ok(byteRead > overflow, "one-over chunk must fail before byte accounting");
  assert.ok(decode > overflow, "one-over chunk must fail before decoding");
});
