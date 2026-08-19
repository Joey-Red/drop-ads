import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BUILD_INPUT_FILES, createBuildInfo, fingerprintBuildInputs, serializeBuildInfo } from "../tools/build-info.mjs";
import { ensureBuildInputFixture } from "./helpers/build-input-fixture.js";

async function withFixture(run) {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-info-"));
  try {
    await Promise.all([
      mkdir(join(root, "src", "nested"), { recursive: true }),
      mkdir(join(root, "lists"), { recursive: true }),
      mkdir(join(root, "manifests"), { recursive: true }),
      mkdir(join(root, "tools"), { recursive: true })
    ]);
    await writeFile(join(root, "package.json"), '{"name":"drop-ads","version":"0.1.0"}\n');
    await writeFile(join(root, "src", "z.js"), 'export const z = 1;\n');
    await writeFile(join(root, "src", "nested", "a.js"), 'export const a = 1;\n');
    await writeFile(join(root, "lists", "default.txt"), 'block domain ads.example\n');
    await writeFile(join(root, "manifests", "firefox.json"), '{"manifest_version":3,"name":"drop-ads"}\n');
    await writeFile(join(root, "manifests", "chromium.json"), '{"manifest_version":3,"name":"drop-ads"}\n');
    await writeFile(join(root, "tools", "build.mjs"), 'console.log("build");\n');
    await writeFile(join(root, "tools", "build-info.mjs"), 'export const schema = 1;\n');
    await ensureBuildInputFixture(root);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("build identity uses sorted repository-relative inputs and is deterministic", async () => {
  await withFixture(async (root) => {
    const first = await createBuildInfo(root);
    const second = await createBuildInfo(root);

    assert.deepEqual(first, second);
    assert.match(first.sourceFingerprint, /^sha256:[0-9a-f]{64}$/);
    assert.deepEqual(first.inputs.map((item) => item.path), [
      ...BUILD_INPUT_FILES,
      "lists/default.txt",
      "manifests/chromium.json",
      "manifests/firefox.json",
      "src/nested/a.js",
      "src/z.js"
    ].sort((a, b) => a.localeCompare(b)));
    assert.equal(first.package.name, "drop-ads");
    assert.equal(first.package.version, "0.1.0");
  });
});

test("changing one runtime or build-tool input changes the aggregate fingerprint", async () => {
  await withFixture(async (root) => {
    const before = await createBuildInfo(root);
    await writeFile(join(root, "src", "z.js"), 'export const z = 2;\n');
    const runtimeChanged = await createBuildInfo(root);
    assert.notEqual(before.sourceFingerprint, runtimeChanged.sourceFingerprint);

    await writeFile(join(root, "tools", "build.mjs"), 'console.log("different build");\n');
    const toolingChanged = await createBuildInfo(root);
    assert.notEqual(runtimeChanged.sourceFingerprint, toolingChanged.sourceFingerprint);

    const beforeFile = before.inputs.find((item) => item.path === "src/z.js");
    const afterFile = runtimeChanged.inputs.find((item) => item.path === "src/z.js");
    assert.notEqual(beforeFile.sha256, afterFile.sha256);
    assert.notEqual(beforeFile.bytes, 0);
  });
});

test("aggregate fingerprint is independent of caller input order", () => {
  const inputs = [
    { path: "src/b.js", bytes: 2, sha256: "b".repeat(64) },
    { path: "src/a.js", bytes: 1, sha256: "a".repeat(64) }
  ];
  assert.equal(fingerprintBuildInputs(inputs), fingerprintBuildInputs([...inputs].reverse()));
});

test("build identity excludes machine-specific and temporal data", async () => {
  await withFixture(async (root) => {
    const info = await createBuildInfo(root);
    const serialized = serializeBuildInfo(info);

    for (const forbidden of ["timestamp", "hostname", "username", "userName", "homeDirectory", "cwd", "random", "uuid"]) {
      assert.equal(Object.hasOwn(info, forbidden), false);
      assert.doesNotMatch(serialized, new RegExp(`\\"${forbidden}\\"`, "i"));
    }
    assert.equal(serialized.includes(root), false, "absolute fixture path must not leak into build metadata");
    for (const input of info.inputs) {
      assert.equal(input.path.startsWith("/"), false);
      assert.equal(input.path.includes("\\\\"), false);
      assert.match(input.sha256, /^[0-9a-f]{64}$/);
    }
  });
});
