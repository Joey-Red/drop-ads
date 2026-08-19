import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const storage = fs.readFileSync(new URL("../src/core/storage.js", import.meta.url), "utf8");
const limits = fs.readFileSync(new URL("../src/core/state-limits.js", import.meta.url), "utf8");
const backup = fs.readFileSync(new URL("../src/core/settings-backup.js", import.meta.url), "utf8");

test("canonical cookie-banner mode is configured state only", () => {
  assert.match(storage, /cookieBannerMode: "reject"/);
  assert.match(storage, /COOKIE_BANNER_MODES = new Set\(\["off", "reject"\]\)/);
  assert.match(storage, /cookieBannerMode: normalizeCookieBannerMode\(source\.cookieBannerMode\)/);
  assert.match(storage, /Persisted state cookieBannerMode is invalid/);
  assert.match(limits, /"cookieBannerMode"/);
  assert.match(backup, /cookieBannerMode: normalizeCookieBannerMode\(source\.cookieBannerMode\)/);
  assert.match(backup, /normalizeCookieBannerMode\(source\.cookieBannerMode, "reject"\)/);
  assert.doesNotMatch(storage + backup, /bannerHistory|bannerLog|clickHistory|requestHistory|telemetryId|deviceId/);
});
