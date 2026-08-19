import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1224 rechecks every generated member after final source and tree validation", () => {
  const start = source.indexOf("async function verifyGeneratedBrowserContentFromBuildInfo");
  const end = source.indexOf("export async function verifyGeneratedBrowserContent", start);
  const body = source.slice(start, end);
  const firstLoop = body.indexOf("for (const [path, expectedBytes] of expected.files)");
  const finalFingerprint = body.indexOf("source state changed during generated verification");
  const finalTreeAudit = body.indexOf("await auditGeneratedTree(distDirectory, browser)", finalFingerprint);
  const recheckBudget = body.indexOf("let finalActualTotalBytes = 0", finalTreeAudit);
  const secondLoop = body.indexOf("for (const [path, expectedBytes] of expected.files)", firstLoop + 1);
  const finish = body.indexOf("await finishGeneratedVerificationPass(verificationPass)");

  assert.ok(firstLoop >= 0);
  assert.ok(finalFingerprint > firstLoop);
  assert.ok(finalTreeAudit > finalFingerprint);
  assert.ok(recheckBudget > finalTreeAudit);
  assert.ok(secondLoop > recheckBudget);
  assert.ok(finish > secondLoop);
  assert.match(body, /final generated content recheck/);
  assert.match(body, /generated file changed during final verification recheck/);
  assert.match(body, /readActualGeneratedOutput\(distDirectory, path, browser\)/);
});
