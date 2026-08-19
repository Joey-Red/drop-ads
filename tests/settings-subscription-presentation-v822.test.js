import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dynamic = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");

test("configured filter lists expose visible origin and committed state", () => {
  assert.match(dynamic, /import "\.\/subscription-presentation\.js";/);
  assert.match(source, /import \{ subscriptionCommitStatus \} from "\.\.\/core\/ui-commit-status\.js";/);
  assert.match(source, /"External HTTPS list" : "Built-in list"/);
  assert.match(source, /subscriptionCommitStatus\(Boolean\(checkbox\.checked\), checkboxBusy\(checkbox\)\)/);
  assert.match(source, /Built-in source stays configured; turn Enabled off to stop using it\./);
  assert.match(source, /subscriptionList\.addEventListener\("change"/);
  assert.match(source, /subscriptionPresentationObserver\?\.disconnect\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|telemetry|analytics/i);
});
