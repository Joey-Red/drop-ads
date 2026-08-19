import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner discovery is bounded, deterministic, transient, and descriptor-safe", () => {
  assert.match(source, /MAX_COOKIE_BANNER_SCAN_NODES = 2_000/);
  assert.match(source, /MAX_COOKIE_BANNER_CANDIDATES = 64/);
  assert.match(source, /MAX_COOKIE_BANNER_TEXT_CHARS = 160/);
  assert.match(source, /captureData\(DocumentPrototype, "createTreeWalker"\)/);
  assert.match(source, /const SHOW_ELEMENT = captureData\(NodeFilterObject, "SHOW_ELEMENT"\)/);
  assert.match(source, /const walker = createTreeWalker\(current\.root, SHOW_ELEMENT\)/);
  assert.match(source, /isButtonLike\(node\) && !isDropAdsOwned\(node\)/);
  assert.match(source, /Object\.freeze\(candidates\)/);
  assert.doesNotMatch(source, /document\.createTreeWalker\(/);
  assert.doesNotMatch(source, /storage|runtime\.sendMessage|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/);
});
