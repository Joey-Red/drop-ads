import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/qualification-server.mjs", import.meta.url), "utf8");

test("loopback qualification fixture exposes deterministic cookie-banner scenarios", () => {
  assert.match(source, /id="cookie-banner-static-card"/);
  assert.match(source, /aria-label="Cookie privacy choices"/);
  assert.match(source, /id="cookie-banner-static-reject" type="button">Reject all cookies</);
  assert.match(source, /id="generic-consent-card"/);
  assert.match(source, /aria-label="Medical consent form"/);
  assert.match(source, /id="generic-consent-decline" type="button">Decline</);
  assert.match(source, /id="cookie-shadow-card"/);
  assert.match(source, /host\.attachShadow\(\{ mode: "open" \}\)/);
  assert.match(source, /Reject optional cookies/);
  assert.match(source, /setTimeout\(\(\) => \{/);
  assert.match(source, /\}, 750\);/);
  assert.match(source, /PASS: immediate cookie reject action activated/);
  assert.match(source, /PASS: delayed open-shadow cookie reject action activated/);
  assert.match(source, /FAIL for automatic qualification: generic non-cookie Decline was activated/);
  assert.doesNotMatch(source, /https:\/\//);
});
