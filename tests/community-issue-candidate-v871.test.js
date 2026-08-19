import assert from "node:assert/strict";
import test from "node:test";
import { buildCommunityIssueFields } from "../src/core/community-issue.js";

test("M871 accepts only canonical domain candidates for community issue fields", () => {
  const fields = buildCommunityIssueFields({ kind: "domain", value: "ads.example.com" });
  assert.equal(Object.isFrozen(fields), true);
  assert.match(fields.title, /ads\.example\.com/);
  assert.match(fields.body, /block domain ads\.example\.com/);
  assert.throws(() => buildCommunityIssueFields({ kind: "domain", value: "HTTPS://ADS.EXAMPLE.COM/path" }), /canonical/);
  assert.throws(() => buildCommunityIssueFields({ kind: "url", value: "https://ads.example.com/" }), /domain/);
  assert.throws(() => buildCommunityIssueFields({ kind: "domain", value: "ads.example.com", sourcePage: "https://private.example/" }), /unknown|field|object/i);
});

test("M871 rejects accessor-backed community issue candidates without reading them", () => {
  let reads = 0;
  const candidate = { kind: "domain" };
  Object.defineProperty(candidate, "value", { enumerable: true, get() { reads += 1; return "ads.example.com"; } });
  assert.throws(() => buildCommunityIssueFields(candidate));
  assert.equal(reads, 0);
});
