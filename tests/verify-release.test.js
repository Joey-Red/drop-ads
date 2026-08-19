import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { allowedFilesForBrowser, COMMON_ALLOWED_FILES } from "../tools/artifact-audit.mjs";
import { createBuildInfo } from "../tools/build-info.mjs";
import { expectedGeneratedFiles } from "../tools/build-output-verify.mjs";
import { createStoredZipBuffer, makeStoredZip } from "../tools/deterministic-zip.mjs";
import { createReleaseManifest, serializeReleaseManifest } from "../tools/release-manifest.mjs";
import { verifyRelease } from "../tools/verify-release.mjs";
import { ensureBuildInputFixture } from "./helpers/build-input-fixture.js";
import { ensureReleaseToolFixture } from "./helpers/release-tool-fixture.js";

async function write(root, path, content) {
  await mkdir(join(root, dirname(path)), { recursive: true });
  await writeFile(join(root, path), content);
}

async function makeFixture(run) {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-verify-release-"));
  try {
    await write(root, "package.json", '{"name":"drop-ads","version":"0.1.0","type":"module"}\n');
    await write(root, "manifests/chromium.json", '{"manifest_version":3,"name":"drop-ads"}\n');
    await write(root, "manifests/firefox.json", '{"manifest_version":3,"name":"drop-ads"}\n');
    await write(root, "lists/default.meta.json", '{"schemaVersion":1}\n');
    await write(root, "lists/default.txt", '# fixture\n');
    await write(root, "tools/build.mjs", '// fixture build tool\n');
    await write(root, "tools/build-info.mjs", '// fixture build identity tool\n');
    await write(root, "tools/deterministic-zip.mjs", '// fixture zip writer\n');
    await write(root, "tools/package.mjs", '// fixture packager\n');
    await write(root, "tools/release-manifest.mjs", 'import { RELEASE_TOOL_PATHS } from "./release-tool-contract.mjs";\nexport const PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS;\n');
    await write(root, "tools/verify-reproducible.mjs", '// fixture reproducibility verifier\n');
    await ensureBuildInputFixture(root);
    await ensureReleaseToolFixture(root);

    const runtimeFiles = COMMON_ALLOWED_FILES.filter((path) =>
      path !== "build-info.json" && path !== "manifest.json" && !path.startsWith("lists/"));
    for (const path of runtimeFiles) await write(root, `src/${path}`, `${path}\n`);
    await write(root, "src/rules/static.json", "[]\n");

    const buildInfo = await createBuildInfo(root);
    for (const browser of ["chromium", "firefox"]) {
      const expected = await expectedGeneratedFiles(root, browser);
      for (const [path, bytes] of expected.files) await write(root, `dist/${browser}/${path}`, bytes);
    }

    const chromiumArtifact = "dist/drop-ads-0.1.0-chromium.zip";
    const firefoxArtifact = "dist/drop-ads-0.1.0-firefox.xpi";
    await makeStoredZip(join(root, "dist/chromium"), join(root, chromiumArtifact));
    await makeStoredZip(join(root, "dist/firefox"), join(root, firefoxArtifact));

    const releaseManifest = await createReleaseManifest({
      rootDirectory: root,
      packageName: "drop-ads",
      version: "0.1.0",
      sourceFingerprint: buildInfo.sourceFingerprint,
      artifacts: [
        { browser: "chromium", path: chromiumArtifact },
        { browser: "firefox", path: firefoxArtifact }
      ]
    });
    await write(root, "dist/release-manifest.json", serializeReleaseManifest(releaseManifest));

    await run(root, { buildInfo, chromiumArtifact, firefoxArtifact });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function archiveEntriesFromTree(root, browser) {
  const entries = [];
  for (const path of allowedFilesForBrowser(browser)) {
    entries.push({ name: path, data: await readFile(join(root, "dist", browser, path)) });
  }
  return entries;
}

test("release verifier accepts matching source identity, manifest, audited trees, and archive payloads", async () => {
  await makeFixture(async (root, { buildInfo }) => {
    const result = await verifyRelease(root);
    assert.equal(result.sourceFingerprint, buildInfo.sourceFingerprint);
    assert.equal(result.generatedFiles.chromium, allowedFilesForBrowser("chromium").length);
    assert.equal(result.generatedFiles.firefox, allowedFilesForBrowser("firefox").length);
    assert.equal(result.payloadEntries.chromium, allowedFilesForBrowser("chromium").length);
    assert.equal(result.payloadEntries.firefox, allowedFilesForBrowser("firefox").length);
    assert.deepEqual(result.artifacts.map((item) => item.browser), ["chromium", "firefox"]);
  });
});

test("release verifier rejects a tampered recorded manifest", async () => {
  await makeFixture(async (root) => {
    const path = join(root, "dist/release-manifest.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.artifacts[0].sha256 = "0".repeat(64);
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(verifyRelease(root), /release-manifest\.json does not match/);
  });
});

test("release verifier rejects generated runtime tampering before trusting its package manifest", async () => {
  await makeFixture(async (root) => {
    await write(root, "dist/chromium/core/runtime.js", "tampered generated runtime\n");
    await assert.rejects(verifyRelease(root), /chromium generated file does not match current source\/build transformation: core\/runtime\.js/);
  });
});

test("even a recomputed manifest cannot hide an archive payload that differs from the audited generated tree", async () => {
  await makeFixture(async (root, { buildInfo, chromiumArtifact, firefoxArtifact }) => {
    const chromiumEntries = await archiveEntriesFromTree(root, "chromium");
    const background = chromiumEntries.find((entry) => entry.name === "background.js");
    background.data = Buffer.from("forged payload\n");
    await writeFile(join(root, chromiumArtifact), createStoredZipBuffer(chromiumEntries));

    const forgedManifest = await createReleaseManifest({
      rootDirectory: root,
      packageName: "drop-ads",
      version: "0.1.0",
      sourceFingerprint: buildInfo.sourceFingerprint,
      artifacts: [
        { browser: "chromium", path: chromiumArtifact },
        { browser: "firefox", path: firefoxArtifact }
      ]
    });
    await writeFile(join(root, "dist/release-manifest.json"), serializeReleaseManifest(forgedManifest));

    await assert.rejects(verifyRelease(root), /Archive payload differs from generated tree for background\.js/);
  });
});

test("release verifier rejects an archive with a missing payload even when its hash is recorded", async () => {
  await makeFixture(async (root, { buildInfo, chromiumArtifact, firefoxArtifact }) => {
    const chromiumEntries = (await archiveEntriesFromTree(root, "chromium")).filter((entry) => entry.name !== "popup/popup.js");
    await writeFile(join(root, chromiumArtifact), createStoredZipBuffer(chromiumEntries));

    const forgedManifest = await createReleaseManifest({
      rootDirectory: root,
      packageName: "drop-ads",
      version: "0.1.0",
      sourceFingerprint: buildInfo.sourceFingerprint,
      artifacts: [
        { browser: "chromium", path: chromiumArtifact },
        { browser: "firefox", path: firefoxArtifact }
      ]
    });
    await writeFile(join(root, "dist/release-manifest.json"), serializeReleaseManifest(forgedManifest));

    await assert.rejects(verifyRelease(root), /Archive entry set does not match generated tree/);
  });
});
