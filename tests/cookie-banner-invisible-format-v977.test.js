import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M977 rejects invisible and bidi formatting controls across action-name channels", () => {
  assert.match(source, /FORBIDDEN_ACTION_FORMAT_PATTERN/);
  assert.match(source, /\\u200B-\\u200F/);
  assert.match(source, /\\u202A-\\u202E/);
  assert.match(source, /\\u2060/);
  assert.match(source, /\\u2066-\\u2069/);
  assert.match(source, /\\uFEFF/);
  assert.match(source, /function sourceHasForbiddenFormat\(value\)/);
  assert.match(source, /function sourceUnicodeSafe\(value\)/);
  assert.match(source, /function visibleSourceHasSafeFormat\(element\)/);
  assert.match(source, /sourceHasForbiddenFormat\(rawIds\)/);
  assert.match(source, /sourceUnicodeSafe\(raw\)/);
  assert.match(source, /!visibleSourceHasSafeFormat\(element\)/);
});

test("M977 does not profile language or retain action text", () => {
  assert.doesNotMatch(source, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|analytics|telemetry/i);
});
