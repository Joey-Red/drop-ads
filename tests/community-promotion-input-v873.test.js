import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");

test("community promotion snapshots exact bounded body/list input", () => {
  assert.match(source, /const PROMOTION_INPUT_KEYS = new Set\(\["body", "listText"\]\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(input, key\)/);
  assert.match(source, /Buffer\.byteLength\(snapshot\.body, "utf8"\) > MAX_COMMUNITY_SUBMISSION_BODY_BYTES/);
  assert.match(source, /Buffer\.byteLength\(snapshot\.listText, "utf8"\) > MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /return Object\.freeze\(snapshot\)/);
});

test("invalid promotion input returns privacy-minimal failure", () => {
  assert.match(source, /reason: "Community promotion input is invalid"/);
  assert.match(source, /changed: false/);
  assert.match(source, /listText: ""/);
});
