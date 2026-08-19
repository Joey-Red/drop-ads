import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");
const descriptorSafety = fs.readFileSync(new URL("../tools/build-input-descriptor-safety.mjs", import.meta.url), "utf8");

test("M1162 bounds build-input hashing before and during I/O", () => {
  assert.match(descriptorSafety, /MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES = 16 \* 1024 \* 1024/);
  assert.match(source, /MAX_BUILD_INPUT_FILE_BYTES = MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES/);
  assert.match(source, /MAX_SOURCE_HASH_INPUT_BYTES = MAX_BUILD_INPUT_FILE_BYTES/);
  assert.match(source, /before\.size > MAX_BUILD_INPUT_FILE_BYTES/);
  assert.match(source, /opened\.size > MAX_BUILD_INPUT_FILE_BYTES/);
  assert.match(source, /bytes > MAX_BUILD_INPUT_FILE_BYTES/);
  assert.match(source, /bytes !== opened\.size/);
});

test("M1162 revalidates opened and pathname identity after hashing", () => {
  assert.match(source, /sameIdentity\(before, opened\)/);
  assert.match(source, /sameSnapshot\(opened, after\)/);
  assert.match(source, /pathnameAfter = await requireRegularFile\(path\)/);
  assert.match(source, /Build input pathname identity changed while hashing/);
  assert.doesNotMatch(source, /createReadStream/);
});
