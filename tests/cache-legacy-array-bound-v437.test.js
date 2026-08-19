import test from "node:test";
import assert from "node:assert/strict";
import { assertRawCacheEntryWorkBound, rawCacheEntryItemCount } from "../src/core/cache-codec.js";

test("M437 revoked legacy policy arrays fail closed without leaking revocation", () => {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  const entry = { block: proxy, allow: [], cosmeticHide: [], cosmeticAllow: [], nextRefreshAt: 0 };
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(() => assertRawCacheEntryWorkBound(entry), /exact plain-data cache schema/);
});

test("M437 ordinary legacy non-array compatibility remains zero-work", () => {
  const entry = { block: null, allow: "legacy-invalid", cosmeticHide: undefined, cosmeticAllow: [], nextRefreshAt: 0 };
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.equal(assertRawCacheEntryWorkBound(entry), 0);
});

test("M437 work counting is based on detached dense array lengths", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../src/core/cache-codec.js", import.meta.url), "utf8"));
  assert.match(source, /function detachedArrayLength\(value, label\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(value, "length"\)/);
  assert.match(source, /detachedArrayLength\(entry\.block, "Legacy cache block"\)/);
  assert.doesNotMatch(source, /Array\.isArray\(value\) \? value\.length : 0/);
});
