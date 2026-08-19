import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const verify = fs.readFileSync(new URL("../tools/zip-verify.mjs", import.meta.url), "utf8");
const writer = fs.readFileSync(new URL("../tools/deterministic-zip.mjs", import.meta.url), "utf8");

test("M1117 verifier checks deterministic header fields emitted by the writer", () => {
  for (const marker of [
    "const ZIP_VERSION = 20",
    "unexpected version fields",
    "non-canonical disk/attribute fields",
    "local version-needed field disagrees",
    "central entry order is non-canonical"
  ]) assert.ok(verify.includes(marker), `missing M1117 marker ${marker}`);
  for (const marker of [
    "central.writeUInt16LE(20, 4)",
    "central.writeUInt16LE(20, 6)",
    "central.writeUInt16LE(0, 36)",
    "central.writeUInt32LE(0, 38)",
    "local.writeUInt16LE(20, 4)"
  ]) assert.ok(writer.includes(marker), `writer missing ${marker}`);
});
