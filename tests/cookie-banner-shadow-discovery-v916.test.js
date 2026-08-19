import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner discovery traverses only bounded open shadow roots through captured state", () => {
  assert.match(source, /MAX_COOKIE_BANNER_SHADOW_ROOTS = 32/);
  assert.match(source, /MAX_COOKIE_BANNER_SHADOW_DEPTH = 4/);
  assert.match(source, /const scanRoot = root \|\| documentElement\(\)/);
  assert.match(source, /const rootQueue = \[\{ root: scanRoot, depth: 0 \}\]/);
  assert.match(source, /const seenRoots = new Set\(\[scanRoot\]\)/);
  assert.match(source, /current\.depth < MAX_COOKIE_BANNER_SHADOW_DEPTH/);
  assert.match(source, /shadowRoots < MAX_COOKIE_BANNER_SHADOW_ROOTS/);
  assert.match(source, /const shadowRoot = openShadowRoot\(node\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowRootGetter, element, \[\]\)/);
  assert.match(source, /rootQueue\.push\(\{ root: shadowRoot, depth: current\.depth \+ 1 \}\)/);
  assert.doesNotMatch(source, /node\?\.shadowRoot|node\.shadowRoot|attachShadow|mode:\s*["']closed["']/);
});
