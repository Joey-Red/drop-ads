import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

test("M846 picker save failures remain retryable without destroying the session", () => {
  const saveStart = source.indexOf('save.addEventListener("click", async () => {');
  const saveEnd = source.indexOf('cancel.addEventListener("click", cleanup);', saveStart);
  const body = source.slice(saveStart, saveEnd);
  assert.ok(body.includes("if (!candidate || saving) return;"));
  assert.ok(body.includes("saving = true;"));
  assert.ok(body.includes("cleanup();"));
  assert.ok(body.includes("} catch (error) {\n          saving = false;"));
  assert.ok(body.includes("messageContract.contentCaughtErrorMessage(error, failureText)"));
  assert.ok(body.includes("bestEffortPickerDisabled(save, false);"));
  assert.ok(body.includes("bestEffortPickerDisabled(cancel, false);"));
});
