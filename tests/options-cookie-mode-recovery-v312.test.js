import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("cookie mode retains a committed visual fallback", () => {
  assert.match(source, /let lastCommittedCookieMode = cookieMode\.value;/);
  assert.match(source, /const previousCommitted = lastCommittedCookieMode;/);
  assert.match(source, /lastCommittedCookieMode = desired;/);
  assert.match(source, /lastCommittedCookieMode = state\.cookieMode;/);
});

test("cookie mode recovery cannot mask the primary mutation failure", () => {
  assert.match(source, /const primaryMessage = optionsCaughtErrorMessage\(error, "Could not change cookie mode"\);/);
  assert.match(source, /try \{\s*const state = await loadState\(api\);/s);
  assert.match(source, /catch \{\s*\/\/ The original mutation failure remains authoritative if recovery also fails\./s);
  assert.match(source, /if \(!restored\) cookieMode\.value = previousCommitted;/);
  assert.match(source, /cookieExceptionError\.textContent = primaryMessage;/);
});
