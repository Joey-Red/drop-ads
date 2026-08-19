import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M815 picker launch is lifecycle guarded and retryable", () => {
  assert.match(source, /if \(!pageActive \|\| !Number\.isInteger\(currentTabId\) \|\| pickElement\.disabled\) return/);
  assert.match(source, /const releaseBusy = beginPopupBusy\(pickElement\)/);
  assert.match(source, /publishSiteStatus\("Starting element picker…"\)/);
  assert.match(source, /await sendPopupTopFrameMessage\(api, currentTabId, \{ type: "drop-ads:start-element-picker" \}\)/);
  assert.match(source, /if \(pageActive\) \{[\s\S]*window\.close\(\)/);
  assert.match(source, /popupCaughtErrorMessage\(error, "Could not start element picker on this page"\)/);
  assert.match(source, /if \(pageActive && pickElement\.isConnected\) pickElement\.disabled = false/);
  assert.match(source, /releaseBusy\(\)/);
});
