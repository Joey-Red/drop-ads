import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1057 base discovery uses captured tree and shadow primitives", () => {
  assert.match(source, /function discoverActionCandidates\(root = null\)/);
  assert.match(source, /const scanRoot = root \|\| documentElement\(\)/);
  assert.match(source, /const walker = createTreeWalker\(current\.root, SHOW_ELEMENT\)/);
  assert.match(source, /const shadowRoot = openShadowRoot\(node\)/);
  assert.match(source, /node = walkerNextNode\(walker\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowRootGetter, element, \[\]\)/);
});

test("M1057 preserves discovery work ceilings and root deduplication", () => {
  for (const marker of [
    "MAX_COOKIE_BANNER_SCAN_NODES = 2_000",
    "MAX_COOKIE_BANNER_CANDIDATES = 64",
    "MAX_COOKIE_BANNER_SHADOW_ROOTS = 32",
    "MAX_COOKIE_BANNER_SHADOW_DEPTH = 4",
    "const seenRoots = new Set([scanRoot])",
    "!seenRoots.has(shadowRoot)",
    "seenRoots.add(shadowRoot)"
  ]) assert.ok(source.includes(marker), `missing ${marker}`);
});

test("M1057 refuses live discovery DOM fallback", () => {
  assert.doesNotMatch(source, /document\.createTreeWalker\(/);
  assert.doesNotMatch(source, /walker\.nextNode\(/);
  assert.doesNotMatch(source, /node\?\.shadowRoot|node\.shadowRoot/);
  assert.doesNotMatch(source, /function discoverActionCandidates\(root = document\.documentElement\)/);
});
