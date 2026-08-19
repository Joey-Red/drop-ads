import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1178 revalidates package metadata pathname identity after bounded handle reads", () => {
  assert.match(buildInfo, /async function readBoundedBuildUtf8File\(path, maxBytes, label\)/);
  assert.match(buildInfo, /const pathnameAfter = await requireRegularFile\(path\);\s*if \(!sameIdentity\(before, pathnameAfter\) \|\| !sameSnapshot\(before, pathnameAfter\)\) throw new Error\(`\$\{label\} pathname identity changed while reading`\)/s);
});

test("M1178 preserves strict UTF-8 and package byte ceilings", () => {
  assert.match(buildInfo, /BUILD_PACKAGE_MAX_BYTES = 256 \* 1024/);
  assert.match(buildInfo, /new TextDecoder\("utf-8", \{ fatal: true \}\)/);
  assert.match(buildInfo, /readBoundedBuildUtf8File\(resolve\(root, "package\.json"\), BUILD_PACKAGE_MAX_BYTES, "package\.json"\)/);
});
