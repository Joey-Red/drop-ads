import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("domain, URL, and TLD policy inputs request URL-oriented touch keyboards", () => {
  for (const id of ["block-input", "allow-input", "country-custom-tld", "cosmetic-hide-domain", "cosmetic-allow-domain", "subscription-url", "cookie-exception-input"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*inputmode="url"`));
  }
});

test("cosmetic selectors remain text-oriented and policy fields expose enter hints", () => {
  assert.match(html, /id="cosmetic-hide-selector"[^>]*inputmode="text"[^>]*enterkeyhint="done"/);
  assert.match(html, /id="cosmetic-allow-selector"[^>]*inputmode="text"[^>]*enterkeyhint="done"/);
  assert.match(html, /id="cosmetic-hide-domain"[^>]*enterkeyhint="next"/);
  assert.match(html, /id="cosmetic-allow-domain"[^>]*enterkeyhint="next"/);
});
