import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyQualificationArtifactFile } from "../tools/qualification-artifact-verify.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("stream verifier accepts exact regular-file bytes and rejects mismatches", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qual-artifact-"));
  try {
    const path = join(root, "candidate.zip");
    const bytes = Buffer.from("qualification-package\n");
    await writeFile(path, bytes);
    await assert.doesNotReject(() => verifyQualificationArtifactFile(path, { bytes: bytes.length, sha256: sha256(bytes) }, "candidate"));
    await assert.rejects(() => verifyQualificationArtifactFile(path, { bytes: bytes.length + 1, sha256: sha256(bytes) }, "candidate"), /byte size/);
    await assert.rejects(() => verifyQualificationArtifactFile(path, { bytes: bytes.length, sha256: "0".repeat(64) }, "candidate"), /SHA-256/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stream verifier rejects symlink package paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qual-artifact-link-"));
  try {
    const target = join(root, "target.zip");
    const link = join(root, "link.zip");
    const bytes = Buffer.from("package\n");
    await writeFile(target, bytes);
    await symlink(target, link);
    await assert.rejects(() => verifyQualificationArtifactFile(link, { bytes: bytes.length, sha256: sha256(bytes) }, "candidate"), /non-symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
