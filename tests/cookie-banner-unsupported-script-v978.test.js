import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M978 rejects surviving non-ASCII semantic letters or numbers after bounded folding", () => {
  assert.match(source, /const MAX_UNICODE_FOLDED_CHARS = 1_024;/);
  assert.match(source, /UNICODE_LETTER_OR_NUMBER_PATTERN = \/\[\\p\{L\}\\p\{N\}\]\//);
  assert.match(source, /function sourceHasUnsupportedSemanticCodePoint\(value\)/);
  assert.match(source, /normalize\("NFKD"\)/);
  assert.match(source, /folded.length > MAX_UNICODE_FOLDED_CHARS/);
  assert.match(source, /char\.codePointAt\(0\)/);
  assert.match(source, /UNICODE_LETTER_OR_NUMBER_PATTERN\.test\(char\)/);
  assert.match(source, /function sourceUnicodeSafe\(value\)/);
});

test("M978 checks raw length before direct Unicode inspection", () => {
  const directBlock = source.slice(source.indexOf("function directSourcesWithinBounds"), source.indexOf("function directChannelsAgree"));
  assert.ok(directBlock.indexOf("source.length > MAX_ACTION_RAW_CHARS") < directBlock.indexOf("sourceUnicodeSafe(source)"));
  const labelledBlock = source.slice(source.indexOf("function completeLabelledBySource"), source.indexOf("function labelledBySourceWithinBounds"));
  assert.ok(labelledBlock.indexOf("rawIds.length > MAX_ARIA_LABELLEDBY_ATTR_CHARS") < labelledBlock.indexOf("sourceHasForbiddenFormat(rawIds)"));
});

test("M978 adds no locale profiling or retention", () => {
  assert.doesNotMatch(source, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|analytics|telemetry/i);
});
