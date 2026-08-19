import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1230 performs a second bounded generated-member byte comparison before pass finish", () => {
  const sourceRefingerprint = source.indexOf("const finalBuildInfo = await createBuildInfo(root)");
  const secondAudit = source.indexOf("await auditGeneratedTree(distDirectory, browser);", source.indexOf("await auditGeneratedTree(distDirectory, browser);") + 1);
  const finalBudget = source.indexOf("let finalActualTotalBytes = 0");
  const finalRead = source.indexOf("const finalBytes = await readActualGeneratedOutput");
  const finalMismatch = source.indexOf("generated file changed during final verification recheck");
  const finishPass = source.indexOf("await finishGeneratedVerificationPass(verificationPass)");

  assert.ok(sourceRefingerprint >= 0);
  assert.ok(secondAudit > sourceRefingerprint);
  assert.ok(finalBudget > secondAudit);
  assert.ok(finalRead > finalBudget);
  assert.ok(finalMismatch > finalRead);
  assert.ok(finishPass > finalMismatch);
});

test("M1230 final recheck has its own aggregate byte ceiling accounting", () => {
  assert.match(source, /finalActualTotalBytes = admitAggregate\(finalActualTotalBytes, finalBytes, `\$\{browser\} final generated content recheck`\)/);
});
