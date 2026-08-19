import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-locale-extension.js", import.meta.url), "utf8");

test("M1017 bounds and validates the localized rejection lexicon", () => {
  assert.match(source, /const MAX_LOCALIZED_REJECTION_PHRASES = 32;/);
  assert.match(source, /const MAX_LOCALIZED_PHRASE_CHARS = 96;/);
  assert.match(source, /function buildLocalizedLexicon\(entries\)/);
  assert.match(source, /!Object\.isFrozen\(entries\)/);
  assert.match(source, /function snapshotLocalizedTuple\(entry\)/);
  assert.match(source, /!Object\.isFrozen\(entry\)/);
  assert.match(source, /lengthDescriptor\.value !== 2/);
  assert.match(source, /score !== 100 && score !== 86/);
  assert.match(source, /Object\.prototype\.hasOwnProperty\.call\(lookup, tuple\.phrase\)/);
  assert.match(source, /normalized !== phrase/);
});

test("M1017 preserves base scoring before localized fail-closed behavior", () => {
  const baseIndex = source.indexOf("if (baseScore > 0) return baseScore;");
  const localizedIndex = source.indexOf("if (!LOCALIZED_SCORE_BY_PHRASE) return 0;");
  assert.ok(baseIndex >= 0);
  assert.ok(localizedIndex > baseIndex);
});

test("M1017 localization layer retains zero profile/persistence/network surface", () => {
  assert.doesNotMatch(source, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});