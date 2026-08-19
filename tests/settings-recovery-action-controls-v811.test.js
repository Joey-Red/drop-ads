import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("M811 recovery actions expose their changed list", () => {
  assert.match(source, /disabledSites: document\.querySelector\("#disabled-sites"\)/);
  assert.match(source, /cookieExceptions: document\.querySelector\("#cookie-exception-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.disabledSites, "disabled-sites"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cookieExceptions, "cookie-exception-list"\)/);
});
