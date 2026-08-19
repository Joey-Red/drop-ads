import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const entry = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");

test("M825 configured lists expose local visible origin and committed state notes", () => {
  assert.match(entry, /import "\.\/subscription-presentation\.js";/);
  assert.match(source, /import \{ subscriptionCommitStatus \} from "\.\.\/core\/ui-commit-status\.js";/);
  assert.match(source, /"External HTTPS list" : "Built-in list"/);
  assert.match(source, /subscriptionCommitStatus\(Boolean\(checkbox\.checked\), checkboxBusy\(checkbox\)\)/);
  assert.match(source, /subscriptionPresentationObserver\.observe\(subscriptionList, \{\s*childList: true,\s*subtree: true,\s*attributes: true,\s*attributeFilter: \["disabled", "aria-busy"\]\s*\}\);/s);
  assert.match(source, /subscriptionPresentationObserver\?\.disconnect\(\)/);
  assert.match(source, /removeEventListener\("change", handleSubscriptionStateChange\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|browser\.storage|chrome\.storage|fetch\(|XMLHttpRequest|telemetry|analytics|history/i);
});
