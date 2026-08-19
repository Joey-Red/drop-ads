import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../tools/atomic-output-temp.mjs", import.meta.url), "utf8");
const releaseOutput = fs.readFileSync(new URL("../tools/release-output-io.mjs", import.meta.url), "utf8");
const packageOutput = fs.readFileSync(new URL("../tools/package-output-io.mjs", import.meta.url), "utf8");

test("M1135 validates final atomic output type and byte size", () => {
  assert.match(helper, /assertAtomicOutputPublished/);
  assert.match(helper, /Atomic output publish did not produce a regular file/);
  assert.match(helper, /Atomic output published byte size is invalid/);
  assert.match(helper, /stat\.size !== expectedBytes/);
});

test("M1135 both writers verify the published path after rename", () => {
  for (const source of [releaseOutput, packageOutput]) {
    const publish = source.indexOf("await rename(temp, output)");
    const verify = source.indexOf("await assertAtomicOutputPublished(output, bytes)");
    assert.ok(publish >= 0 && verify > publish, "publish verification must follow rename");
  }
});
