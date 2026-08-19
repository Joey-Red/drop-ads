import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/community-ui.js", import.meta.url), "utf8");

test("community preference publishes truthful busy, commit, and rollback state", () => {
  assert.match(source, /pendingPreference = autoSubmit\.checked/);
  assert.match(source, /autoSubmit\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /Saving community contribution preference/);
  assert.match(source, /Automatic community draft preparation is/);
  assert.match(source, /Drafts always require your review before submission/);
  assert.match(source, /Community contribution preference could not be saved\. The previous setting remains active/);
  assert.match(source, /autoSubmit\?\.removeAttribute\("aria-busy"\)/);
  assert.match(source, /autoSubmitObserver\?\.disconnect\(\)/);
});
