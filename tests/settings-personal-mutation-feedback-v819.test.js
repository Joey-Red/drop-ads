import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const helper = fs.readFileSync(new URL("../src/options/personal-mutation-feedback.js", import.meta.url), "utf8");
const targets = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("M819 personal row mutations retain guidance and feedback relationships", () => {
  assert.match(targets, /import "\.\/personal-mutation-feedback\.js";/);
  assert.match(helper, /appendDescription\(row\.querySelector\("button\.remove"\), helpId, errorId\)/);
  assert.match(helper, /appendDescription\(action, "block-help", "community-help", "block-error"\)/);
  assert.match(helper, /appendDescription\(action, "allow-help", "allow-error"\)/);
  assert.match(helper, /observer\.observe\(list, \{ childList: true, subtree: true \}\)/);
  assert.match(helper, /window\.addEventListener\("pagehide"/);
});
