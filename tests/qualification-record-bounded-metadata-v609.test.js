import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../tools/qualification-record.mjs", import.meta.url), "utf8");

test("qualification record metadata reads use the bounded strict-UTF-8 boundary", () => {
  assert.match(source, /readQualificationUtf8File/);
  assert.match(source, /QUALIFICATION_RECORD_MAX_BYTES/);
  assert.doesNotMatch(source, /readFile\(resolve\(root, "dist", "chromium", "build-info\.json"\)/);
  assert.doesNotMatch(source, /readFile\(resolve\(root, "dist", "firefox", "build-info\.json"\)/);
  assert.doesNotMatch(source, /readFile\(resolve\(root, "dist", "release-manifest\.json"\)/);
});
