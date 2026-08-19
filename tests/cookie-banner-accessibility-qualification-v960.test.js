import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/cookie-banner-accessibility-qualification-server.mjs", import.meta.url), "utf8");

test("localization/accessibility qualification fixture is loopback-only and deterministic", () => {
  assert.match(source, /COOKIE_BANNER_QUALIFICATION_HOST = "127\.0\.0\.1"/);
  for (const route of ["/de", "/fr", "/es", "/it", "/pt", "/nl", "/es-necessary", "/labelledby", "/labelledby-unsafe", "/generic"]) {
    assert.ok(source.includes(`\"${route}\"`), `fixture is missing ${route}`);
  }
  assert.match(source, /Alle ablehnen/);
  assert.match(source, /Tout refuser/);
  assert.match(source, /Sólo cookies necesarias/);
  assert.match(source, /aria-labelledby=\"reject-label\"/);
  assert.match(source, /aria-labelledby=\"unsafe-label\"/);
  assert.match(source, /Generic non-cookie consent refusal/);
  assert.match(source, /applyQualificationServerBounds\(server\)/);
  assert.doesNotMatch(source, /https:\/\/|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|analytics|telemetry\s*\(/i);
});
