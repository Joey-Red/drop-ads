import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../tools/cookie-banner-action-source-qualification-server.mjs", import.meta.url), "utf8");

test("M1010 exposes six isolated positive localized reject controls", () => {
  const controls = [
    ["/polish-control", "Odrzuć wszystkie", "Ustawienia prywatności i pliki cookie", "PASS: Polish localized reject activated."],
    ["/swedish-control", "Avvisa alla", "Integritetsval för kakor", "PASS: Swedish localized reject activated."],
    ["/danish-control", "Afvis alle", "Privatlivsvalg og cookies", "PASS: Danish localized reject activated."],
    ["/norwegian-control", "Avvis alle", "Personvernvalg og informasjonskapsler", "PASS: Norwegian localized reject activated."],
    ["/finnish-control", "Hylkää kaikki", "Tietosuojavalinnat ja evästeet", "PASS: Finnish localized reject activated."],
    ["/czech-control", "Odmítnout vše", "Volby soukromí a soubory cookie", "PASS: Czech localized reject activated."]
  ];
  for (const [route, label, context, pass] of controls) {
    assert.ok(server.includes(`\"${route}\"`), `missing route ${route}`);
    assert.ok(server.includes(label), `missing localized action ${label}`);
    assert.ok(server.includes(context), `missing strong context ${context}`);
    assert.ok(server.includes(pass), `missing visible PASS status for ${route}`);
  }
});

test("M1010 fixture remains loopback-only, bounded, and observation-free", () => {
  assert.match(server, /const HOST = "127\.0\.0\.1"/);
  assert.match(server, /\["GET", "HEAD"\]\.includes\(request\.method\)/);
  assert.match(server, /const MAX_REQUEST_URL_CHARS = 2048/);
  assert.match(server, /const MAX_CONNECTIONS = 16/);
  assert.doesNotMatch(server, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|localStorage|sessionStorage|indexedDB/i);
});
