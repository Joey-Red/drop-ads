import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const storage = fs.readFileSync(new URL("../src/core/storage.js", import.meta.url), "utf8");
const limits = fs.readFileSync(new URL("../src/core/state-limits.js", import.meta.url), "utf8");

test("configured state carries bounded cookie-banner site exclusions", () => {
  assert.match(storage, /cookieBannerDisabledSites: EMPTY_STATE_COLLECTION/);
  assert.match(storage, /cookieBannerDisabledSites: Object\.freeze\(\[\]\)/);
  assert.match(storage, /cookieBannerDisabledSites: Object\.freeze\(normalizeDomainSet\(source\.cookieBannerDisabledSites\)\)/);
  assert.match(limits, /"cookieBannerDisabledSites"/);
  assert.match(limits, /\["cookieBannerDisabledSites", LIVE_STATE_LIMITS\.domains\]/);
});
