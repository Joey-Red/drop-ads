import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const guide = fs.readFileSync(new URL("../docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md", import.meta.url), "utf8");

test("M1069 guide covers exact-head controller platform observations", () => {
  for (const marker of [
    "Issue #10 remains the authoritative exact-head Chromium + Firefox release gate",
    "top-level loopback page",
    "child frame",
    "non-HTTP(S)",
    "document.readyState",
    "16 attempts",
    "30-second observation window",
    "150ms mutation settling",
    "MutationObserver",
    "newly reachable open shadow root",
    "Reject cookie banners when possible",
    "Exact-candidate invalidation"
  ]) assert.ok(guide.includes(marker), `missing guide marker ${marker}`);
});

test("M1069 guide keeps browser evidence and privacy boundaries explicit", () => {
  assert.match(guide, /tests, source audits, loopback fixtures, and generated qualification records are preflight\/supporting evidence/);
  assert.match(guide, /full URLs, paths, queries, fragments, titles, referrers, or browsing history/);
  assert.match(guide, /statistics, timestamps, identifiers, analytics, or telemetry/);
  assert.match(guide, /cookie-banner-controller-platform-audit/);
  assert.match(guide, /cookie-banner-platform-integration-audit/);
});
