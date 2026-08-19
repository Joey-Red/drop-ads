import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");
const integration = fs.readFileSync(new URL("../tools/generated-release-integration-audit.mjs", import.meta.url), "utf8");
const historical = fs.readFileSync(new URL("./build-generated-contract-v1104.test.js", import.meta.url), "utf8");

test("M1148 reads contract members through bounded identity-safe source IO", () => {
  for (const marker of [
    'import { readRegularFileBounded } from "./package-source-io.mjs"',
    "maxBytes: BUILD_OUTPUT_BINARY_MAX_BYTES",
    "allowEmpty: false",
    "await writeBuildOutputBinaryAtomic(root, destinationRelative, data)"
  ]) assert.ok(build.includes(marker), `missing M1148 build marker ${marker}`);
  assert.doesNotMatch(build, /\bcopyFile\s*\(/);
});

test("M1148 reconciles historical and integration expectations to bounded atomic copy", () => {
  assert.match(historical, /readRegularFileBounded/);
  assert.match(historical, /writeBuildOutputBinaryAtomic/);
  for (const marker of ["readRegularFileBounded", "writeBuildOutputBinaryAtomic", "BUILD_OUTPUT_BINARY_MAX_BYTES"]) {
    assert.ok(integration.includes(marker), `missing M1148 integration marker ${marker}`);
  }
});
