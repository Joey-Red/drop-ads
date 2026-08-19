import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const io = fs.readFileSync(new URL("../tools/community-file-io.mjs", import.meta.url), "utf8");
const promote = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");

test("M881 community list replacement is exclusive, fsynced and conflict checked", () => {
  assert.match(io, /open\(tempPath, "wx", 0o600\)/);
  assert.match(io, /await handle\.sync\(\)/);
  assert.match(io, /current\.ino !== before\.ino/);
  assert.match(io, /rename\(tempPath, path\)/);
  assert.match(io, /unlink\(tempPath\)/);
  assert.match(promote, /writeCommunityListFileAtomic/);
});
