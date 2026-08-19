import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const locale = fs.readFileSync(new URL("../src/content/cookie-banner-locale-extension.js", import.meta.url), "utf8");

test("M1028 snapshots frozen lexicon arrays through exact data descriptors", () => {
  assert.match(locale, /function frozenDataDescriptor\(object, key, enumerable\)/);
  assert.match(locale, /descriptor\.enumerable !== enumerable/);
  assert.match(locale, /descriptor\.writable/);
  assert.match(locale, /descriptor\.configurable/);
  assert.match(locale, /function snapshotLocalizedTuple\(entry\)/);
  assert.match(locale, /keys\.length !== 3/);
  assert.match(locale, /lengthDescriptor\.value !== 2/);
  assert.match(locale, /function buildLocalizedLexicon\(entries\)/);
  assert.match(locale, /keys\.length !== length \+ 1/);
  assert.match(locale, /const entryDescriptor = frozenDataDescriptor\(entries, key, true\)/);
});

test("M1028 compiles exact localized labels into an immutable null-prototype lookup", () => {
  assert.match(locale, /const lookup = Object\.create\(null\)/);
  assert.match(locale, /Object\.prototype\.hasOwnProperty\.call\(lookup, tuple\.phrase\)/);
  assert.match(locale, /Object\.defineProperty\(lookup, tuple\.phrase/);
  assert.match(locale, /return Object\.freeze\(lookup\)/);
  assert.match(locale, /const LOCALIZED_SCORE_BY_PHRASE = buildLocalizedLexicon\(LOCALIZED_REJECTION_PHRASES\)/);
  assert.match(locale, /Object\.prototype\.hasOwnProperty\.call\(LOCALIZED_SCORE_BY_PHRASE, text\)/);
  assert.doesNotMatch(locale, /for \(const \[phrase, score\] of LOCALIZED_REJECTION_PHRASES\)/);
});

test("M1028 descriptor-safe lexicon keeps the privacy boundary", () => {
  assert.doesNotMatch(locale, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i);
});
