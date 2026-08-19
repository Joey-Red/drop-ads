import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup-global-semantics.js", import.meta.url), "utf8");
const commitStatus = fs.readFileSync(new URL("../src/core/ui-commit-status.js", import.meta.url), "utf8");

test("popup keeps a helper-owned global-off explanation without overwriting explicit feedback", () => {
  assert.match(html, /<script type="module" src="popup-global-semantics\.js"><\/script>/);
  assert.match(source, /import \{ GLOBAL_BLOCKING_OFF_STATUS, GLOBAL_BLOCKING_ON_STATUS, globalBlockingCommitStatus \} from "\.\.\/core\/ui-commit-status\.js";/);
  assert.match(commitStatus, /export const GLOBAL_BLOCKING_OFF_STATUS = "Global blocking is off\. Your saved local rules and exceptions remain stored\.";/);
  assert.match(source, /popupMain\?\.getAttribute\("aria-busy"\) === "true"/);
  assert.match(source, /existing === GLOBAL_BLOCKING_ON_STATUS \|\| existing === GLOBAL_BLOCKING_OFF_STATUS/);
  assert.match(source, /globalBlockingCommitStatus\(Boolean\(enabled\?\.checked\)\)/);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.match(source, /if \(existing !== next\) globalStatus\.textContent = next;/);
  assert.match(source, /observer\?\.disconnect\(\)/);
});
