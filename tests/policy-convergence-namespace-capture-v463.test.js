import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M463 policy convergence captures API namespaces through bounded data-property inspection", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /const runtime = captureDataValue\(api, "runtime", "Policy convergence runtime namespace"\);/);
  assert.match(source, /const runtimeMessage = captureDataValue\(runtime, "onMessage", "Policy convergence runtime\.onMessage event"\);/);
  assert.match(source, /const contextMenus = captureDataValue\(api, "contextMenus", "Policy convergence contextMenus namespace"\);/);
  assert.match(source, /const contextClicked = captureDataValue\(contextMenus, "onClicked", "Policy convergence contextMenus\.onClicked event"\);/);
  assert.match(source, /const alarms = captureDataValue\(api, "alarms", "Policy convergence alarms namespace"\);/);
  assert.match(source, /const alarm = captureDataValue\(alarms, "onAlarm", "Policy convergence alarms\.onAlarm event"\);/);
});

test("M463 namespace admission rejects accessors before event registration", () => {
  assert.match(source, /if \(!\("value" in descriptor\)\) throw new TypeError\(`\$\{label\} must be a data property`\);/);
  assert.match(source, /runtimeMessage: captureEvent\(runtimeMessage, "Policy convergence runtime\.onMessage"\)/);
  assert.match(source, /installListenersTransactionally\(\[/);
});
