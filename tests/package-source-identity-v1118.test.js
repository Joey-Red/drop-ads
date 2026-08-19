import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const io = fs.readFileSync(new URL("../tools/package-source-io.mjs", import.meta.url), "utf8");
const writer = fs.readFileSync(new URL("../tools/deterministic-zip.mjs", import.meta.url), "utf8");
const verifier = fs.readFileSync(new URL("../tools/zip-verify.mjs", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");

test("M1118 reads release source files through bounded opened-handle identity checks", () => {
  for (const marker of [
    "must be a regular non-symlink file",
    "exceeds its byte ceiling before allocation",
    "changed before bounded read",
    "changed during bounded read",
    "Buffer.alloc(opened.size)",
    "await open(path, \"r\")"
  ]) assert.ok(io.includes(marker), `missing M1118 helper marker ${marker}`);
  assert.match(writer, /readRegularFileBounded\(path,/);
  assert.match(verifier, /readRegularFileBounded\(sourceEntries\[index\]\.path,/);
});

test("M1118 verifies generated traversal entries and tracks the helper in release provenance", () => {
  assert.match(verifier, /Generated tree root must be a real directory/);
  assert.match(verifier, /Generated tree contains non-regular entry/);
  assert.ok(contract.includes('"tools/package-source-io.mjs"'));
  assert.ok(contract.includes('"tools/package-output-io.mjs"'));
  assert.doesNotMatch(io, /fetch\(|XMLHttpRequest|WebSocket|navigator|localStorage|sessionStorage|telemetry|analytics/i);
});
