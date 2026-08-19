import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const path of [
  "tools/qualification-observation-next.mjs",
  "tools/qualification-observation-summary.mjs"
]) {
  test(`${path} uses bounded qualification artifact reads`, async () => {
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /readQualificationUtf8File/);
    assert.match(source, /QUALIFICATION_PACKAGE_MAX_BYTES/);
    assert.match(source, /QUALIFICATION_RECORD_MAX_BYTES/);
    assert.match(source, /QUALIFICATION_OBSERVATION_MAX_BYTES/);
    assert.doesNotMatch(source, /from "node:fs\/promises"/);
  });
}
