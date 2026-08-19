import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CACHE_SOURCE_URL_CHARS,
  MAX_CACHE_SOURCE_URL_INPUT_CHARS,
  decodeCacheEntry,
  encodeCacheEntry
} from "../src/core/cache-codec.js";

function parsed(sourceKey) {
  return {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    sourceKey
  };
}

test("cache source identity rejects private, local, single-label, and credential-bearing HTTPS sources", () => {
  for (const sourceUrl of [
    "https://127.0.0.1/list.txt",
    "https://localhost/list.txt",
    "https://intranet/list.txt",
    "https://169.254.10.20/list.txt",
    "https://192.168.1.10/list.txt",
    "https://user:pass@example.com/list.txt"
  ]) {
    assert.throws(() => encodeCacheEntry(parsed(`hosts\u0000${sourceUrl}`), 1), /source identity/i, sourceUrl);
  }
});

test("v5 cache entry with a non-public bound source fails closed", () => {
  const entry = {
    v: 5,
    b: { d: ["ads.example.com"] },
    a: {},
    c: [1, 0, 0, 0],
    s: "hosts\u0000https://127.0.0.1/list.txt",
    n: 1
  };
  assert.equal(decodeCacheEntry(entry), null);
});

test("cache source URL enforces raw and canonical subscription ceilings", () => {
  const base = "https://example.com/";
  const exactCanonical = `${base}${"a".repeat(MAX_CACHE_SOURCE_URL_CHARS - base.length)}`;
  const oneOverCanonical = `${exactCanonical}a`;
  assert.equal(exactCanonical.length, MAX_CACHE_SOURCE_URL_CHARS);
  assert.equal(encodeCacheEntry(parsed(`hosts\u0000${exactCanonical}`), 1).s, `hosts\u0000${exactCanonical}`);
  assert.throws(() => encodeCacheEntry(parsed(`hosts\u0000${oneOverCanonical}`), 1), /source identity/i);

  const rawOver = `${base}${"a".repeat(MAX_CACHE_SOURCE_URL_INPUT_CHARS)}`;
  assert.ok(rawOver.length > MAX_CACHE_SOURCE_URL_INPUT_CHARS);
  assert.throws(() => encodeCacheEntry(parsed(`hosts\u0000${rawOver}`), 1), /source identity/i);
});

test("cache source identity strips fragments while preserving public query parameters", () => {
  const entry = encodeCacheEntry(parsed("third-party\u0000https://example.com/filter.txt?variant=mini&token=abc#section"), 1);
  assert.equal(entry.s, "third-party\u0000https://example.com/filter.txt?variant=mini&token=abc");
  assert.equal(decodeCacheEntry(entry).sourceKey, "third-party\u0000https://example.com/filter.txt?variant=mini&token=abc");
});

test("cache source identity rejects unknown formats and malformed separators", () => {
  for (const key of [
    "unknown\u0000https://example.com/list.txt",
    "hosts\u0000https://example.com/list.txt\u0000extra",
    "hostshttps://example.com/list.txt"
  ]) {
    assert.throws(() => encodeCacheEntry(parsed(key), 1), /source identity/i);
  }
});
