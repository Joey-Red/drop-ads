import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1149 creates build directories one verified segment at a time", () => {
  for (const marker of [
    "canonicalBuildDirectory",
    "ensureBuildDirectory",
    "BUILD_OUTPUT_MAX_DIRECTORY_DEPTH",
    "BUILD_OUTPUT_PATH_MAX_BYTES",
    'await mkdir(current, { mode: 0o700 })',
    'await requireRealDirectory(current, "Build directory component")'
  ]) assert.ok(build.includes(marker), `missing M1149 directory marker ${marker}`);
  assert.doesNotMatch(build, /mkdir\([^\n]*recursive:\s*true/);
});

test("M1149 invalidates partial dist output on build failure", () => {
  assert.match(build, /catch \(error\) \{[\s\S]*await rm\(dist, \{ recursive: true, force: true \}\)/);
  assert.match(build, /new AggregateError\(\[error, cleanupError\], "Build failed and partial generated output could not be invalidated"\)/);
  const audits = build.indexOf("await auditGeneratedExtensionContract(root)");
  const initialReset = build.indexOf("await rm(dist, { recursive: true, force: true })");
  const buildInfo = build.indexOf("await createBuildInfo(root)");
  assert.ok(audits >= 0 && initialReset > audits && buildInfo > initialReset);
});
