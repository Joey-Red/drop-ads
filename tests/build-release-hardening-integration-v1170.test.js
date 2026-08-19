import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const integration = fs.readFileSync(new URL("../tools/build-release-hardening-audit.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("M1170 joins build-input hardening through the existing build-release gate", () => {
  assert.match(integration, /import \{ auditBuildInputHardening \} from "\.\/build-input-hardening-audit\.mjs"/);
  assert.match(integration, /auditBuildInputHardening\(\);/);
  assert.match(integration, /build-release-hardening-audit: build fingerprint and release manifest boundaries verified/);
  assert.match(integration, /build-release-hardening-audit: extended through M1169 build input fingerprint boundaries/);
});

test("M1170 keeps canonical check wiring singular", () => {
  assert.equal((pkg.scripts.check.match(/npm run build-release-hardening-audit/g) || []).length, 1);
  assert.equal((pkg.scripts.check.match(/npm run build-input-hardening-audit/g) || []).length, 0);
});
