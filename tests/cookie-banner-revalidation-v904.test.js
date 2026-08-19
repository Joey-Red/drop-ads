import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner activation revalidates exact consent ownership immediately before click", () => {
  assert.match(source, /ownDataValue\(utils, "snapshotCandidate"\)/);
  assert.match(source, /snapshot = Reflect\.apply\(snapshotCandidate, undefined, \[candidate\]\)/);
  assert.match(source, /const consentRoot = snapshot\.consentRoot/);
  assert.match(source, /!nodeConnected\(consentRoot\)/);
  assert.match(source, /nodeContains\(consentRoot, element\)/);
  assert.match(source, /currentConsentRoot = Reflect\.apply\(findConsentContainer, undefined, \[element\]\)/);
  assert.match(source, /currentConsentRoot !== consentRoot/);
  assert.match(source, /currentText !== snapshot\.text/);
  assert.match(source, /score = currentText \? Reflect\.apply\(rejectionScore, undefined, \[currentText\]\) : 0/);
  assert.match(source, /Number\.isSafeInteger\(score\) && score > 0 && score <= 100/);
  assert.match(source, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
});

test("cookie-banner activation fails closed rather than retaining DOM state", () => {
  assert.doesNotMatch(source, /setTimeout|setInterval|MutationObserver|storage|localStorage|sessionStorage|indexedDB|fetch\(/);
  assert.match(source, /catch \{ return false; \}|catch \{\s*return false;\s*\}/s);
});
