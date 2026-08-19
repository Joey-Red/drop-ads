import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const helper = fs.readFileSync(new URL("../src/options/disabled-site-feedback.js", import.meta.url), "utf8");
const targets = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("M820 Disabled sites recovery owns local status feedback", () => {
  assert.match(targets, /import "\.\/disabled-site-feedback\.js";/);
  assert.match(helper, /status\.id = "disabled-sites-status"/);
  assert.match(helper, /status\.setAttribute\("role", "status"\)/);
  assert.match(helper, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(helper, /status\.textContent = "Re-enabling site protection…"/);
  assert.match(helper, /status\.textContent = "Site protection re-enabled\."/);
  assert.match(helper, /if \(!pageActive \|\| !pendingRecovery \|\| !legacyError\?\.textContent\) return/);
  assert.match(helper, /status\.textContent = legacyError\.textContent/);
  assert.match(helper, /legacyError\.textContent = ""/);
  assert.match(helper, /listObserver\?\.disconnect\(\)/);
  assert.match(helper, /errorObserver\?\.disconnect\(\)/);
  for (const forbidden of ["localStorage", "sessionStorage", "storage.local", "fetch(", "sendMessage("]) {
    assert.equal(helper.includes(forbidden), false, `Disabled sites feedback must not use ${forbidden}`);
  }
});
