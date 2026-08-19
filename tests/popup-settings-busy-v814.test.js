import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup Settings opening uses lifecycle-safe busy feedback", () => {
  assert.match(source, /settings\.addEventListener\("click", async \(\) => \{/);
  assert.match(source, /if \(!pageActive \|\| settings\.disabled\) return;/);
  assert.match(source, /const releaseBusy = beginPopupBusy\(settings\);/);
  assert.match(source, /const revision = publishGlobalStatus\("Opening Settings…"\);/);
  assert.match(source, /await Promise\.resolve\(openPopupOptionsPage\(api\)\);\n    clearGlobalStatus\(revision\);/);
  assert.match(source, /popupCaughtErrorMessage\(error, "Could not open Settings"\)/);
});
