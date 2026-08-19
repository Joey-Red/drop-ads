import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildOutput = fs.readFileSync(new URL("../tools/build-output-io.mjs", import.meta.url), "utf8");
const atomic = fs.readFileSync(new URL("../tools/atomic-output-temp.mjs", import.meta.url), "utf8");

test("M1144 verifies final build output after atomic rename", () => {
  const rename = buildOutput.indexOf("await rename(temp, output)");
  const verify = buildOutput.indexOf("await assertAtomicOutputPublished(output, bytes)");
  assert.ok(rename >= 0 && verify > rename, "published build output verification must follow rename");
});

test("M1144 shared published verifier requires regular non-symlink exact-size output", () => {
  for (const marker of [
    "Atomic output publish did not produce a regular file",
    "Atomic output published byte size is invalid",
    "stat.isSymbolicLink()",
    "stat.size !== expectedBytes"
  ]) assert.ok(atomic.includes(marker), `missing M1144 shared verifier marker ${marker}`);
});
