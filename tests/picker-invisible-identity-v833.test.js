import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

function loadUtils() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.DropAdsSelectorUtils;
}

test("M833 stable picker identity rejects invisible formatting tokens", () => {
  const { stableToken } = loadUtils();
  assert.equal(stableToken("visible-token"), "visible-token");
  for (const value of [
    "zero\u200bwidth",
    "join\u200der",
    "word\u2060joiner",
    "bom\ufefftoken",
    "grapheme\u034fjoiner",
    "arabic\u061cmark",
    "mongolian\u180eseparator"
  ]) assert.equal(stableToken(value), null);
});
