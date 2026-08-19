import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACKAGING_TOOL_PATHS } from "../tools/release-manifest.mjs";
import { writeReleaseManifestAtomic } from "../tools/release-manifest-io.mjs";

function validManifest() {
  return {
    schemaVersion: 1,
    package: { name: "drop-ads", version: "0.1.0" },
    sourceFingerprint: `sha256:${"a".repeat(64)}`,
    packagingTools: PACKAGING_TOOL_PATHS.map((path, index) => ({ path, bytes: index + 1, sha256: "b".repeat(64) })),
    artifacts: [
      { browser: "chromium", file: "drop-ads-0.1.0-chromium.zip", bytes: 10, sha256: "c".repeat(64) },
      { browser: "firefox", file: "drop-ads-0.1.0-firefox.xpi", bytes: 11, sha256: "f".repeat(64) }
    ]
  };
}

test("writeReleaseManifestAtomic replaces the destination with validated JSON and leaves no pending file", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-atomic-"));
  try {
    const dist = join(root, "dist");
    await mkdir(dist);
    const output = join(dist, "release-manifest.json");
    await writeReleaseManifestAtomic(output, validManifest());
    const parsed = JSON.parse(await readFile(output, "utf8"));
    assert.equal(parsed.schemaVersion, 1);
    assert.deepEqual((await readdir(dist)).filter((name) => name.includes(".pending-")), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("writeReleaseManifestAtomic rejects symlink parent directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-atomic-"));
  try {
    const real = join(root, "real");
    const alias = join(root, "alias");
    await mkdir(real);
    await symlink(real, alias, "dir");
    await assert.rejects(() => writeReleaseManifestAtomic(join(alias, "release-manifest.json"), validManifest()), /real directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("writeReleaseManifestAtomic validates before persistence", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-atomic-"));
  try {
    const dist = join(root, "dist");
    await mkdir(dist);
    const invalid = validManifest();
    invalid.artifacts[0].file = "wrong.zip";
    await assert.rejects(() => writeReleaseManifestAtomic(join(dist, "release-manifest.json"), invalid), /file is invalid/);
    assert.deepEqual(await readdir(dist), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
