import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M972 validates both direct action channels and requires exact agreement", () => {
  assert.match(source, /function directActionChannels\(element\)/);
  assert.match(source, /for \(const source of \[channels\.value, channels\.ariaLabel\]\)/);
  assert.match(source, /function directChannelsAgree\(element\)/);
  assert.match(source, /valueName === ariaName/);
  assert.match(source, /!directChannelsAgree\(element\)/);
});

test("M972 keeps action-name comparison transient", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});
