import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/deterministic-zip.mjs", import.meta.url), "utf8");

test("M1138 computes and enforces the final archive ceiling before Buffer.concat", () => {
  const total = source.indexOf("const finalArchiveBytes = offset + centralSize + 22");
  const ceiling = source.indexOf("ZIP archive exceeds release byte ceiling before final allocation");
  const allocation = source.indexOf("Buffer.concat([...localParts, ...centralParts, end], finalArchiveBytes)");
  assert.ok(total >= 0 && ceiling > total && allocation > ceiling);
  assert.match(source, /finalArchiveBytes > ZIP_LIMITS\.maxArchiveBytes/);
  assert.match(source, /Number\.isSafeInteger\(finalArchiveBytes\)/);
});

test("M1138 atomic publication uses the same shared archive ceiling", () => {
  assert.match(source, /writePackageBinaryAtomic\(outputPath, zip, \{ maxBytes: ZIP_LIMITS\.maxArchiveBytes \}\)/);
  assert.doesNotMatch(source, /maxTotalUncompressedBytes \+ 16 \* 1024 \* 1024/);
});
