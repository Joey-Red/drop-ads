import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1055 classifies controls through captured native state", () => {
  assert.match(source, /function isDropAdsOwned\(element\)/);
  assert.match(source, /Reflect\.apply\(nativeClosest, element/);
  assert.match(source, /function isNavigationLike\(element\)/);
  assert.match(source, /elementHasAttribute\(element, "href"\)/);
  assert.match(source, /elementHasAttribute\(element, "formaction"\)/);
  assert.match(source, /buttonType\(element\) === "submit" && buttonHasForm\(element\)/);
  assert.match(source, /inputType\(element\) === "submit"/);
  assert.match(source, /function isButtonLike\(element\)/);
  assert.match(source, /!buttonDisabled\(element\)/);
  assert.match(source, /!inputDisabled\(element\) && inputType\(element\) === "button"/);
  assert.match(source, /elementAttribute\(element, "role"\) === "button"/);
  assert.match(source, /elementAttribute\(element, "aria-disabled"\) !== "true"/);
});

test("M1055 direct input text uses captured value state without instanceof", () => {
  assert.match(source, /elementTagName\(element\) === "input"/);
  assert.match(source, /inputValue\(element\) \|\| elementAttribute\(element, "aria-label"\)/);
  assert.doesNotMatch(source, /instanceof HTMLInputElement|instanceof HTMLButtonElement/);
  assert.doesNotMatch(source, /element\.value|element\.type|element\.disabled|element\.form/);
});
