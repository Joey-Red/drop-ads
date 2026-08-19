import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
test("alarm scheduling uses captured collaborators", () => {
  assert.match(source, /alarmClear = captureBoundMethod/);
  assert.match(source, /alarmCreate = captureBoundMethod/);
  assert.match(source, /Promise\.resolve\(alarmClear\(LIST_REFRESH_ALARM\)\)/);
  assert.match(source, /Promise\.resolve\(alarmCreate\(LIST_REFRESH_ALARM/);
});
