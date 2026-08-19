import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

test("picker save guard is independent from button disabled state", () => {
  assert.match(source, /let saving = false;/);
  assert.match(source, /save\.addEventListener\("click", async \(\) => \{\s*if \(!candidate \|\| saving\) return;\s*saving = true;/s);
});

test("recoverable save failure clears in-flight guard before UI recovery", () => {
  const saveStart = source.indexOf('save.addEventListener("click", async () => {');
  const saveEnd = source.indexOf('cancel.addEventListener("click", cleanup);', saveStart);
  const body = source.slice(saveStart, saveEnd);
  const catchIndex = body.indexOf("} catch (error) {");
  const savingReset = body.indexOf("saving = false;", catchIndex);
  const statusRecovery = body.indexOf("bestEffortPickerText(message, failureText);", catchIndex);
  assert.ok(catchIndex >= 0);
  assert.ok(savingReset > catchIndex);
  assert.ok(statusRecovery > savingReset);
});

test("session cleanup clears save guard", () => {
  const cleanupStart = source.indexOf("cleanup = function cleanupSession() {");
  const cleanupEnd = source.indexOf("cleanupRef = cleanup;", cleanupStart);
  const body = source.slice(cleanupStart, cleanupEnd);
  assert.match(body, /saving = false;/);
});
