import test from "node:test";
import assert from "node:assert/strict";
import { allowedFilesForBrowser, validateGeneratedEntry } from "../tools/artifact-audit.mjs";

for (const browser of ["chromium", "firefox"]) {
  test(`${browser} generated-content allowlist includes the reviewed Settings boundary`, () => {
    const files = allowedFilesForBrowser(browser);
    assert.equal(files.includes("core/options-boundary.js"), true);
    assert.equal(validateGeneratedEntry("core/options-boundary.js", "file", browser), null);
  });
}

test("Settings boundary admission remains exact rather than directory-wide", () => {
  assert.match(
    validateGeneratedEntry("core/options-boundary-extra.js", "file", "chromium"),
    /not in the generated extension allowlist/
  );
});
