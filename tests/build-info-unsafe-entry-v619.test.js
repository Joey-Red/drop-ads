import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectBuildInputs } from "../tools/build-info.mjs";
import { ensureBuildInputFixture } from "./helpers/build-input-fixture.js";

async function scaffold() {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-info-"));
  for (const dir of ["src", "lists", "manifests", "tools"]) await mkdir(join(root, dir), { recursive: true });
  await ensureBuildInputFixture(root);
  await writeFile(join(root, "src", "ok.js"), "export const ok = true;\n");
  return root;
}

test("collectBuildInputs rejects symlinks under canonical roots", async () => {
  const root = await scaffold();
  try {
    await symlink(join(root, "src", "ok.js"), join(root, "src", "alias.js"));
    await assert.rejects(() => collectBuildInputs(root), /symbolic link|unsafe/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("collectBuildInputs keeps deterministic relative ordering for regular files", async () => {
  const root = await scaffold();
  try {
    await writeFile(join(root, "lists", "z.txt"), "z\n");
    await writeFile(join(root, "lists", "a.txt"), "a\n");
    const inputs = await collectBuildInputs(root);
    const paths = inputs.map((entry) => entry.path);
    assert.deepEqual(paths, [...paths].sort((a, b) => a.localeCompare(b)));
    assert.ok(paths.includes("src/ok.js"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
