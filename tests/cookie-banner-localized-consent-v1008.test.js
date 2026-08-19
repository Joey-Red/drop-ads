import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consent = fs.readFileSync(new URL("../src/content/cookie-banner-consent-safety.js", import.meta.url), "utf8");

test("M1008 adds specific strong consent evidence for the new reviewed languages", () => {
  for (const term of [
    "pliki cookie",
    "ustawienia prywatności",
    "kakor",
    "integritetsval",
    "privatlivsvalg",
    "informasjonskapsler",
    "personvernvalg",
    "evästeet",
    "tietosuojavalinnat",
    "soubory cookie",
    "volby soukromí"
  ]) assert.ok(consent.includes(term), `missing localized consent evidence ${term}`);
});

test("M1008 retains the strong-evidence-only and privacy-minimal boundary", () => {
  assert.match(consent, /boundedConsentContext/);
  assert.doesNotMatch(consent, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
  assert.doesNotMatch(consent, /\b(?:vendors|cmp|personal data)\b/i);
});
