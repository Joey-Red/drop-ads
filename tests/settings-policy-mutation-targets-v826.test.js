import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("recovery, country, and cosmetic row controls declare their rendered mutation targets", () => {
  assert.match(source, /applySimpleListTarget\(lists\.disabledSites, "disabled-sites"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cookieExceptions, "cookie-exception-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.country, "country-list", "select, button\.remove"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticHide, "cosmetic-hide-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticAllow, "cosmetic-allow-list"\)/);
  assert.match(source, /action\.setAttribute\("aria-controls", listId\)/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /observer\.disconnect\(\)/);
});
