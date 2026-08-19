import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BUILD_PACKAGE_MAX_BYTES,
  createBuildInfo,
  fingerprintBuildInputs,
  serializeBuildInfo,
  validateBuildInfo
} from "../tools/build-info.mjs";

function validInfo() {
  const inputs = [{ path: "src/a.js", bytes: 1, sha256: "a".repeat(64) }];
  return {
    schemaVersion: 1,
    package: { name: "drop-ads", version: "0.1.0" },
    sourceFingerprint: `sha256:${fingerprintBuildInputs(inputs)}`,
    inputs
  };
}

test("validateBuildInfo rejects accessor-backed package fields without invoking them", () => {
  let reads = 0;
  const info = validInfo();
  Object.defineProperty(info.package, "name", {
    enumerable: true,
    get() {
      reads += 1;
      return "drop-ads";
    }
  });
  assert.throws(() => validateBuildInfo(info), /data field/);
  assert.equal(reads, 0);
});

test("serializeBuildInfo validates the stored fingerprint", () => {
  const info = validInfo();
  assert.match(serializeBuildInfo(info), /"sourceFingerprint"/);
  info.sourceFingerprint = `sha256:${"f".repeat(64)}`;
  assert.throws(() => serializeBuildInfo(info), /does not match build inputs/);
});

test("createBuildInfo rejects oversized and malformed UTF-8 package metadata before tree traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-meta-"));
  try {
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "package.json"), Buffer.alloc(BUILD_PACKAGE_MAX_BYTES + 1, 0x20));
    await assert.rejects(() => createBuildInfo(root), /byte size|ceiling/i);
    await writeFile(join(root, "package.json"), Buffer.from([0xc3, 0x28]));
    await assert.rejects(() => createBuildInfo(root), /strict UTF-8/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
