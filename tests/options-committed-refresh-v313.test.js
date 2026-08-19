import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("main Settings has a bounded post-commit refresh helper", () => {
  assert.match(source, /async function refreshCommittedView\(task, statusNode, failureText\)/);
  assert.match(source, /const safeFailure = optionsCaughtErrorMessage\(null, failureText\);/);
  assert.match(source, /statusNode\.textContent = safeFailure;/);
  assert.match(source, /return false;/);
});

test("personal and domain mutations separate commit from view refresh", () => {
  assert.match(source, /Cookie exception is active, but Settings could not refresh the site list\./);
  assert.match(source, /Rule change is active, but Settings could not refresh the personal rule lists\./);
  assert.match(source, /Allow override was removed and is active, but Settings could not refresh the personal rule lists\./);
  assert.match(source, /Rule removal is active, but Settings could not refresh the personal rule lists\./);
  assert.match(source, /Site policy change is active, but Settings could not refresh the site list\./);
});

test("focus after committed personal and site mutations is refresh-gated", () => {
  assert.match(source, /if \(refreshed\) cookieExceptionInput\.focus\(\);/);
  assert.match(source, /if \(refreshed\) input\.focus\(\);/);
  assert.match(source, /if \(refreshed\) focusAfterMutation\(container, rowIndex,/);
});
