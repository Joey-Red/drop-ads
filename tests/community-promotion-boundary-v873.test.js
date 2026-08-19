import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");

test("community promotion snapshots exact own-data input and returns immutable output", () => {
  let touched = false;
  const hostile = {};
  Object.defineProperty(hostile, "body", { enumerable: true, get() { touched = true; return "x"; } });
  hostile.listText = "";
  const rejected = promoteCommunitySubmission(hostile);
  assert.equal(touched, false);
  assert.equal(rejected.status, "invalid");
  assert.equal(Object.isFrozen(rejected), true);

  const body = "## Candidate\n\n```text\nblock domain ads.example.com\n```";
  const accepted = promoteCommunitySubmission({ body, listText: "" });
  assert.equal(accepted.status, "ready");
  assert.equal(accepted.changed, true);
  assert.equal(accepted.listText, "block domain ads.example.com\n");
  assert.equal(Object.isFrozen(accepted), true);
});

test("promotion source preserves exact boundary and output size guard", () => {
  assert.match(source, /Reflect\.ownKeys\(input\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(input, key\)/);
  assert.match(source, /MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /Object\.freeze\(/);
});
