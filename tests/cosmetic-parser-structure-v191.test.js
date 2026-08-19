import assert from "node:assert/strict";
import test from "node:test";

import { parseThirdPartyCosmetics } from "../src/core/cosmetic-lists.js";
import { MAX_REMOTE_LIST_LINE_CHARS } from "../src/core/list-limits.js";

test("direct cosmetic parsing enforces the shared remote line-length ceiling", () => {
  const exactComment = `!${"a".repeat(MAX_REMOTE_LIST_LINE_CHARS - 1)}`;
  assert.doesNotThrow(() => parseThirdPartyCosmetics(exactComment));
  assert.throws(
    () => parseThirdPartyCosmetics(`${exactComment}a`),
    /excessively long line/
  );
});

test("direct cosmetic parsing still accepts normal hide and exception syntax", () => {
  const parsed = parseThirdPartyCosmetics("example.com##.sponsor\nexample.com#@#.needed\n");
  assert.deepEqual(parsed.hide, [{ selector: ".sponsor", domains: ["example.com"] }]);
  assert.deepEqual(parsed.allow, [{ selector: ".needed", domains: ["example.com"] }]);
  assert.equal(parsed.unsupportedCount, 0);
});

test("direct cosmetic parsing still rejects non-text input", () => {
  assert.throws(() => parseThirdPartyCosmetics({ toString() { throw new Error("must not coerce"); } }), /text/);
});
