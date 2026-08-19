import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { decodeCacheEntry } from "../src/core/cache-codec.js";
import { makeCacheEntry } from "../src/core/list-updates.js";
import { NATIVE_LIST_FORMAT, parseList } from "../src/core/lists.js";

test("packaged default provides offline network, ad-script, and cosmetic coverage", async () => {
  const text = await readFile(new URL("../lists/default.txt", import.meta.url), "utf8");
  const parsed = parseList(text, NATIVE_LIST_FORMAT);
  const decoded = decodeCacheEntry(makeCacheEntry(parsed, 0, 0));

  assert.ok(decoded.block.some((rule) => rule.kind === "domain" && rule.value === "pagead2.googlesyndication.com"));
  assert.ok(decoded.block.some((rule) => rule.kind === "pattern" && rule.value.includes("/pagead/js/")));
  assert.ok(decoded.cosmeticHide.some((rule) => rule.selector === "ins.adsbygoogle"));
  assert.ok(decoded.cosmeticHide.some((rule) => rule.selector === '[data-ad-slot]'));
  assert.ok(decoded.block.length >= 10, "offline baseline should contain useful network coverage");
  assert.ok(decoded.cosmeticHide.length >= 5, "offline baseline should contain useful cosmetic coverage");
});
