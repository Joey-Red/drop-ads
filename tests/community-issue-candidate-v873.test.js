import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/community-issue.js", import.meta.url), "utf8");

test("community issue builder requires a public canonical domain candidate", () => {
  assert.match(source, /const domain = normalizeDomain\(value\.value\)/);
  assert.match(source, /if \(domain !== value\.value\) throw new Error\("Community issue candidate domain must already be canonical"\)/);
  assert.match(source, /assertRemoteRuleSafe\(Object\.freeze\(\{ kind: "domain", value: domain \}\)\)/);
  assert.match(source, /return Object\.freeze\(\{ kind: "domain", value: domain \}\)/);
});
