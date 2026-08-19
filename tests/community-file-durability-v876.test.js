import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../tools/community-file-io.mjs", import.meta.url), "utf8");

test("community atomic replacement preserves POSIX mode and syncs directory", () => {
  assert.match(source, /await handle\.chmod\(before\.mode & 0o777\)/);
  assert.match(source, /await handle\.sync\(\)/);
  assert.match(source, /await rename\(tempPath, path\)/);
  assert.match(source, /await syncParentDirectory\(path\)/);
  assert.match(source, /const parentHandle = await open\(dirname\(path\), "r"\)/);
  assert.match(source, /await parentHandle\.sync\(\)/);
});

test("post-rename durability failure never unlinks the live destination", () => {
  assert.match(source, /let replaced = false/);
  assert.match(source, /replaced = true/);
  assert.match(source, /if \(!replaced\) \{\s*try \{ await unlink\(tempPath\); \}/s);
});
