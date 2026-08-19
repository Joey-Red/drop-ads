import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");
const body = "```text\nblock domain ads.example.com\n```";

test("M876 promotion rejects noncanonical list text without echoing it", () => {
  for (const listText of ["\uFEFFblock domain old.example\n", "block domain old.example\0\n", "block domain old.example\r\n", "block domain old.example"]) {
    const result = promoteCommunitySubmission({ body, listText });
    assert.equal(result.status, "invalid");
    assert.equal(result.changed, false);
    assert.equal(result.listText, "");
    assert.equal(Object.isFrozen(result), true);
  }
});

test("M876 promotion source fails closed rather than rewriting noncanonical line endings", () => {
  assert.match(source, /listText\.startsWith\("\\uFEFF"\)/);
  assert.match(source, /listText\.includes\("\\0"\)/);
  assert.match(source, /listText\.includes\("\\r"\)/);
  assert.match(source, /!snapshot\.listText\.endsWith\("\\n"\)/);
  assert.doesNotMatch(source, /replace\(\/\\r\\n\/g/);
});
