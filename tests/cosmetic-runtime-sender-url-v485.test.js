import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("M485 uses the canonical 16,384-character URL work ceiling before parsing", () => {
  assert.match(source, /import \{ MAX_NETWORK_RULE_VALUE_CHARS, normalizeDomain \} from "\.\/rules\.js";/);
  const pageStart = source.indexOf("function pageHostname(sender)");
  const boundAt = source.indexOf("url.length > MAX_NETWORK_RULE_VALUE_CHARS", pageStart);
  const parseAt = source.indexOf("new URL(url)", pageStart);
  assert.ok(pageStart >= 0 && boundAt > pageStart && parseAt > boundAt);
});

test("M485 applies one selected-URL boundary after direct-or-tab sender resolution", () => {
  const pageStart = source.indexOf("function pageHostname(sender)");
  const pageEnd = source.indexOf("function siteIsDisabled", pageStart);
  const pageSource = source.slice(pageStart, pageEnd);
  assert.match(pageSource, /const direct = readPlainDataField\(sender, "url"\);/);
  assert.match(pageSource, /const tabUrl = readPlainDataField\(tabField\.value, "url"\);/);
  assert.equal((pageSource.match(/url\.length > MAX_NETWORK_RULE_VALUE_CHARS/g) ?? []).length, 1);
});
