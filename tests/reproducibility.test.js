import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compareSnapshots, formatSnapshotDifferences, snapshotDist } from "../tools/verify-reproducible.mjs";

test("dist snapshot hashes regular files in stable path order without filesystem metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-repro-"));
  try {
    await writeFile(join(root, "package.json"), '{"name":"drop-ads","version":"0.1.0"}\n');
    await mkdir(join(root, "dist", "firefox"), { recursive: true });
    await mkdir(join(root, "dist", "chromium"), { recursive: true });
    await writeFile(join(root, "dist", "firefox", "manifest.json"), "firefox\n");
    await writeFile(join(root, "dist", "chromium", "manifest.json"), "chromium\n");
    await writeFile(join(root, "dist", "drop-ads-0.1.0-chromium.zip"), "chromium archive\n");
    await writeFile(join(root, "dist", "drop-ads-0.1.0-firefox.xpi"), "firefox archive\n");
    await writeFile(join(root, "dist", "release-manifest.json"), "{}\n");
    const snapshot = await snapshotDist(root);
    assert.deepEqual(snapshot.map((entry) => entry.path), [
      "dist/chromium/manifest.json",
      "dist/drop-ads-0.1.0-chromium.zip",
      "dist/drop-ads-0.1.0-firefox.xpi",
      "dist/firefox/manifest.json",
      "dist/release-manifest.json"
    ]);
    assert.ok(snapshot.every((entry) => Number.isInteger(entry.bytes) && /^[0-9a-f]{64}$/.test(entry.sha256)));
    assert.equal(JSON.stringify(snapshot).includes("mtime"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot comparison reports missing and byte-different paths precisely", () => {
  const first = [
    { path: "dist/a", bytes: 1, sha256: "a".repeat(64) },
    { path: "dist/b", bytes: 2, sha256: "b".repeat(64) }
  ];
  const second = [
    { path: "dist/a", bytes: 3, sha256: "c".repeat(64) },
    { path: "dist/c", bytes: 2, sha256: "d".repeat(64) }
  ];
  const differences = compareSnapshots(first, second);
  assert.deepEqual(differences.map((item) => [item.path, item.reason]), [
    ["dist/a", "bytes-differ"],
    ["dist/b", "missing-from-second-pass"],
    ["dist/c", "missing-from-first-pass"]
  ]);
  const formatted = formatSnapshotDifferences(differences).join("\n");
  assert.match(formatted, /dist\/a: first 1 bytes/);
  assert.match(formatted, /dist\/b: only present in first pass/);
  assert.match(formatted, /dist\/c: only present in second pass/);
});

test("identical snapshots produce no differences", () => {
  const snapshot = [{ path: "dist/release-manifest.json", bytes: 10, sha256: "f".repeat(64) }];
  assert.deepEqual(compareSnapshots(snapshot, structuredClone(snapshot)), []);
});
