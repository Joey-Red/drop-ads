import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createReleaseManifest, serializeReleaseManifest } from "../tools/release-manifest.mjs";
import { RELEASE_TOOL_PATHS } from "../tools/release-tool-contract.mjs";
import { ensureReleaseToolFixture } from "./helpers/release-tool-fixture.js";

const FINGERPRINT = `sha256:${"a".repeat(64)}`;

async function withFixture(run) {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-manifest-"));
  try {
    await mkdir(join(root, "dist"), { recursive: true });
    await mkdir(join(root, "tools"), { recursive: true });
    await writeFile(join(root, "tools", "deterministic-zip.mjs"), 'export const zip = true;\n');
    await writeFile(join(root, "tools", "package.mjs"), 'console.log("package");\n');
    await writeFile(join(root, "tools", "release-manifest.mjs"), 'export const schema = 1;\n');
    await writeFile(join(root, "tools", "verify-reproducible.mjs"), 'export const reproducible = true;\n');
    await ensureReleaseToolFixture(root);
    await writeFile(join(root, "dist", "drop-ads-0.1.0-chromium.zip"), Buffer.from("chromium-artifact"));
    await writeFile(join(root, "dist", "drop-ads-0.1.0-firefox.xpi"), Buffer.from("firefox-artifact"));
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function options(root, artifacts = [
  { browser: "firefox", path: "dist/drop-ads-0.1.0-firefox.xpi" },
  { browser: "chromium", path: "dist/drop-ads-0.1.0-chromium.zip" }
]) {
  return {
    rootDirectory: root,
    packageName: "drop-ads",
    version: "0.1.0",
    sourceFingerprint: FINGERPRINT,
    artifacts
  };
}

test("release manifest is deterministic and sorts browser artifacts/tooling", async () => {
  await withFixture(async (root) => {
    const first = await createReleaseManifest(options(root));
    const second = await createReleaseManifest(options(root, [...options(root).artifacts].reverse()));

    assert.deepEqual(first, second);
    assert.deepEqual(first.artifacts.map((item) => item.browser), ["chromium", "firefox"]);
    assert.deepEqual(first.packagingTools.map((item) => item.path), [...RELEASE_TOOL_PATHS].sort((a, b) => a.localeCompare(b)));
    assert.equal(first.sourceFingerprint, FINGERPRINT);
    for (const artifact of first.artifacts) {
      assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
      assert.ok(artifact.bytes > 0);
      assert.equal(artifact.file.includes("/"), false);
      assert.equal(artifact.file.includes("\\"), false);
    }
    for (const tool of first.packagingTools) assert.match(tool.sha256, /^[0-9a-f]{64}$/);
  });
});

test("changing packaged bytes changes only the affected artifact descriptor", async () => {
  await withFixture(async (root) => {
    const before = await createReleaseManifest(options(root));
    await writeFile(join(root, "dist", "drop-ads-0.1.0-chromium.zip"), Buffer.from("different-chromium-artifact"));
    const after = await createReleaseManifest(options(root));

    const beforeChromium = before.artifacts.find((item) => item.browser === "chromium");
    const afterChromium = after.artifacts.find((item) => item.browser === "chromium");
    const beforeFirefox = before.artifacts.find((item) => item.browser === "firefox");
    const afterFirefox = after.artifacts.find((item) => item.browser === "firefox");
    assert.notEqual(beforeChromium.sha256, afterChromium.sha256);
    assert.notEqual(beforeChromium.bytes, afterChromium.bytes);
    assert.deepEqual(beforeFirefox, afterFirefox);
    assert.deepEqual(before.packagingTools, after.packagingTools);
  });
});

test("changing any packaging/reproducibility tool changes its provenance", async () => {
  await withFixture(async (root) => {
    const before = await createReleaseManifest(options(root));

    for (const [path, content] of [
      ["deterministic-zip.mjs", 'export const zip = "changed";\n'],
      ["package.mjs", 'console.log("different package semantics");\n'],
      ["release-manifest.mjs", 'export const schema = 2;\n'],
      ["verify-reproducible.mjs", 'export const reproducible = "changed";\n']
    ]) {
      const current = await createReleaseManifest(options(root));
      await writeFile(join(root, "tools", path), content);
      const after = await createReleaseManifest(options(root));
      const beforeTool = current.packagingTools.find((item) => item.path === `tools/${path}`);
      const afterTool = after.packagingTools.find((item) => item.path === `tools/${path}`);
      assert.notEqual(beforeTool.sha256, afterTool.sha256);
      assert.ok(afterTool.bytes > 0);
    }

    const final = await createReleaseManifest(options(root));
    assert.deepEqual(before.artifacts, final.artifacts);
  });
});

test("release manifest excludes machine-specific and temporal metadata", async () => {
  await withFixture(async (root) => {
    const manifest = await createReleaseManifest(options(root));
    const serialized = serializeReleaseManifest(manifest);

    for (const forbidden of ["timestamp", "createdAt", "hostname", "username", "userName", "cwd", "homeDirectory", "random", "uuid"]) {
      assert.equal(Object.hasOwn(manifest, forbidden), false);
      assert.doesNotMatch(serialized, new RegExp(`\\"${forbidden}\\"`, "i"));
    }
    assert.equal(serialized.includes(root), false, "absolute fixture path must not leak into release metadata");
  });
});

test("release manifest rejects invalid source fingerprints", async () => {
  await withFixture(async (root) => {
    await assert.rejects(createReleaseManifest({ ...options(root), sourceFingerprint: "not-a-fingerprint" }), /sourceFingerprint/);
  });
});
