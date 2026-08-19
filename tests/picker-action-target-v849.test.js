import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

test("M849 gives picker actions a 44px target and loads the UI boundary before picker", () => {
  assert.match(ui, /button \{ min-height:44px;/);
  assert.match(picker, /const pickerUi = globalThis\.DropAdsPickerUi;/);
  assert.match(picker, /ui = pickerUi\.create\(host\);/);
  for (const manifest of [chromium, firefox]) {
    const scripts = manifest.content_scripts[0].js;
    assert.ok(scripts.indexOf("content/picker-ui.js") < scripts.indexOf("content/picker.js"));
  }
});
