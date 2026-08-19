import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M814 Settings launch is busy-visible, retryable, and lifecycle guarded", () => {
  assert.match(source, /settings\.addEventListener\("click", async \(\) => \{/);
  assert.match(source, /if \(!pageActive \|\| settings\.disabled\) return/);
  assert.match(source, /const releaseBusy = beginPopupBusy\(settings\)/);
  assert.match(source, /settings\.disabled = true/);
  assert.match(source, /publishGlobalStatus\("Opening Settings…"\)/);
  assert.match(source, /await Promise\.resolve\(openPopupOptionsPage\(api\)\)/);
  assert.match(source, /popupCaughtErrorMessage\(error, "Could not open Settings"\)/);
  assert.match(source, /if \(pageActive && settings\.isConnected\) settings\.disabled = false/);
  assert.match(source, /releaseBusy\(\)/);
});
