import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("cosmetic runtime warning emissions are best-effort", () => {
  assert.match(source, /function warnBestEffort\(warn, \.\.\.args\) \{\s*try \{ warn\(\.\.\.args\); \} catch \{/s);
  assert.match(source, /warnBestEffort\(warn, "drop-ads could not enumerate tabs for cosmetic refresh", error\);/);
  assert.match(source, /warnBestEffort\(warn, "drop-ads cosmetic refresh broadcast failed", error\);/);
  assert.doesNotMatch(source, /\n\s*warn\("drop-ads could not enumerate tabs for cosmetic refresh"/);
  assert.doesNotMatch(source, /\n\s*warn\("drop-ads cosmetic refresh broadcast failed"/);
});
