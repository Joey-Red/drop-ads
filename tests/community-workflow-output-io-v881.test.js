import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendCommunityWorkflowOutput } from "../tools/community-workflow-io.mjs";

test("community workflow output appends only bounded text to the same regular file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-output-"));
  const path = join(dir, "github-output");
  try {
    await writeFile(path, "", "utf8");
    await appendCommunityWorkflowOutput(path, "status=ready\n");
    assert.equal(await readFile(path, "utf8"), "status=ready\n");
    await assert.rejects(() => appendCommunityWorkflowOutput(path, `value=${"x".repeat(20 * 1024)}\n`), /invalid or too large/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
