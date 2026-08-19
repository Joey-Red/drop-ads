import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/generated-release-integration-audit.mjs", import.meta.url), "utf8");

test("M1230 joins the M1229 generated-verification hardening gate into release integration", () => {
  assert.match(source, /extended through M1229 generated verification pass-binding boundaries verified/);
  assert.match(source, /tests\/generated-verification-pass-ancestry-root-v1229\.test\.js/);
  assert.match(source, /tests\/generated-verification-hardening-audit-v1229\.test\.js/);
  assert.match(source, /auditGeneratedVerificationHardening\(root\)/);
});

test("M1230 preserves historical generated-release integration markers", () => {
  for (const marker of [
    "canonical M1102-M1107 generated artifact boundaries are joined",
    "extended through M1149 atomic generated build I/O boundaries",
    "extended through M1159 generated verification hardening boundaries",
    "extended through M1209 generated verification provenance boundaries",
    "extended through M1219 generated verification traversal boundaries",
    "extended through M1228 generated verification identity boundaries"
  ]) assert.ok(source.includes(marker), `missing historical integration marker: ${marker}`);
});
