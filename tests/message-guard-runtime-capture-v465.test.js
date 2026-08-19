import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M465 message guard captures runtime/onMessage and listener methods once", () => {
  assert.match(source, /const MAX_MESSAGE_GUARD_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /const rawRuntime = captureMessageGuardValue\(api, "runtime", "Message guard runtime namespace"\);/);
  assert.match(source, /const rawOnMessage = captureMessageGuardValue\(rawRuntime, "onMessage", "Message guard runtime\.onMessage event"\);/);
  assert.match(source, /const addMessageListener = captureMessageGuardMethod\(rawOnMessage, "addListener", "Message guard runtime\.onMessage\.addListener"\);/);
  assert.match(source, /const removeMessageListener = captureMessageGuardMethod\(rawOnMessage, "removeListener", "Message guard runtime\.onMessage\.removeListener", false\);/);
});

test("M465 logical removal and failed-registration rollback preserve wrapper identity", () => {
  assert.match(source, /wrappers\.set\(listener, wrapper\);\s*try \{\s*addMessageListener\(wrapper\);\s*\} catch \(error\) \{\s*if \(wrappers\.get\(listener\) === wrapper\) wrappers\.delete\(listener\);/s);
  assert.match(source, /const wrapper = wrappers\.get\(listener\);\s*if \(!wrapper\) return;\s*wrappers\.delete\(listener\);\s*try \{\s*removeMessageListener\?\.\(wrapper\);/s);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
});
