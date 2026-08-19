import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner discovery refuses navigation and submit controls through captured state", () => {
  assert.match(source, /function isNavigationLike\(element\)/);
  assert.match(source, /tag === "a" \|\| tag === "area"/);
  assert.match(source, /elementHasAttribute\(element, "href"\)/);
  assert.match(source, /elementHasAttribute\(element, "formaction"\)/);
  assert.match(source, /buttonType\(element\) === "submit" && buttonHasForm\(element\)/);
  assert.match(source, /inputType\(element\) === "submit"/);
  assert.match(source, /if \(isNavigationLike\(element\)\) return false/);
  assert.match(source, /!inputDisabled\(element\) && inputType\(element\) === "button"/);
  assert.doesNotMatch(source, /instanceof HTMLButtonElement|instanceof HTMLInputElement/);
  assert.doesNotMatch(source, /element\.type|element\.form|element\.disabled/);
});
