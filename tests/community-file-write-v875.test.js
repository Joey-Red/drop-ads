import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const io = fs.readFileSync(new URL("../tools/community-file-io.mjs", import.meta.url), "utf8");

test("community list promotion uses contained exclusive synced atomic replacement", () => {
  assert.match(io, /lstat\(dirname\(path\)\)/);
  assert.match(io, /parent\.isSymbolicLink\(\)/);
  assert.match(io, /open\(tempPath, "wx", 0o600\)/);
  assert.match(io, /await handle\.sync\(\)/);
  assert.match(io, /current\.dev !== before\.dev/);
  assert.match(io, /current\.ino !== before\.ino/);
  assert.match(io, /await rename\(tempPath, path\)/);
  assert.match(io, /await unlink\(tempPath\)/);
});
