import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("subscription mutations use post-commit refresh containment", () => {
  assert.match(source, /Filter list was added and activated, but Settings could not refresh the subscription list\./);
  assert.match(source, /`Filter list was \$\{desired \? "enabled" : "disabled"\}, but Settings could not refresh the subscription list\.`/);
  assert.match(source, /Filter list was removed, but Settings could not refresh the subscription list\./);
});

test("successful subscription mutation is not reverted by refresh failure", () => {
  const enableBlock = source.slice(source.indexOf('checkbox.addEventListener("change"'), source.indexOf("enabledLabel.append"));
  assert.match(enableBlock, /await setSubscriptionEnabled\(subscription, desired\);/);
  assert.match(enableBlock, /await refreshCommittedView\(/);
  assert.match(enableBlock, /catch \(error\) \{\s*checkbox\.checked = !desired;/s);
  assert.doesNotMatch(enableBlock, /if \(!refreshed\)\s*checkbox\.checked/);
});

test("settings import remains committed when the view refresh fails", () => {
  assert.match(source, /Settings were imported and activated, but Settings could not refresh the view\./);
  assert.match(source, /await refreshCommittedView\(\s*render,\s*backupError,/s);
  assert.match(source, /backupStatus\.textContent = `Settings imported and activated locally\.\$\{fetchSummary\}`;/);
});
