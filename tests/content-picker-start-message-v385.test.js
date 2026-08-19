import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

test("picker start message listener contains startup and response failures", () => {
  assert.match(source, /function bestEffortPickerStartResponse\(sendResponse, payload\)/);
  assert.match(source, /function pickerStartFailureText\(error\)/);
  assert.match(source, /if \(!messageContract\.accepts\(message, "drop-ads:start-element-picker"\)\) return false;\s*try \{\s*startPicker\(\);\s*bestEffortPickerStartResponse\(sendResponse, \{ ok: true \}\);\s*\} catch \(error\) \{\s*bestEffortPickerStartResponse\(sendResponse, \{ ok: false, error: pickerStartFailureText\(error\) \}\);\s*\}/s);
});

test("picker start failure formatter retains reviewed fallback", () => {
  assert.match(source, /const fallback = "Could not start element picker";/);
  assert.match(source, /contentCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /return fallback;/);
});
