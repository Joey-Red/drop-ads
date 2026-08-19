import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const entry = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("M826 dynamic policy actions expose only their real local mutation targets", () => {
  assert.match(entry, /import "\.\/mutation-target-semantics\.js";/);
  assert.match(source, /remove\.setAttribute\("aria-controls", listId\)/);
  assert.match(source, /action\.setAttribute\("aria-controls", "block-list allow-list"\)/);
  assert.match(source, /checkbox\.setAttribute\("aria-controls", "subscription-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.disabledSites, "disabled-sites"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cookieExceptions, "cookie-exception-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.country, "country-list", "select, button\.remove"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticHide, "cosmetic-hide-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticAllow, "cosmetic-allow-list"\)/);
  assert.match(source, /else action\.removeAttribute\("aria-controls"\)/);
  assert.match(source, /observer\.disconnect\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|telemetry|analytics/i);
});
