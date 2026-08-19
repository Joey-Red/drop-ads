import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const guide = fs.readFileSync(new URL("../docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md", import.meta.url), "utf8");

const PHASES = [
  "mode-site-recovery",
  "localization",
  "action-identity",
  "context-semantics",
  "platform-controller",
  "late-shadow-revalidation",
  "privacy-finalization"
];

test("M1085 guide is organized by every canonical source-only phase", () => {
  for (const id of PHASES) {
    assert.ok(guide.includes(`## Phase \`${id}\``), `missing phase heading ${id}`);
    assert.ok(guide.includes(`--phase ${id}`), `missing phase command ${id}`);
  }
  assert.match(guide, /seven canonical source-only phases/);
  assert.match(guide, /They do not create seven persisted results/);
});

test("M1085 phased guide preserves guarded recording and privacy boundaries", () => {
  assert.match(guide, /qualify:mark -- scenario cookie-banner-rejection chromium PASS/);
  assert.match(guide, /qualify:mark -- scenario cookie-banner-rejection firefox PASS/);
  assert.match(guide, /do not count as browser observations/);
  assert.match(guide, /No URL\/page\/banner\/action\/accessibility-name\/consent\/DOM\/style\/geometry\/viewport\/hit-test\/shadow\/frame\/document\/observer\/platform\/language history/);
});
