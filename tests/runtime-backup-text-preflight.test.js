import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("backup text character preflight runs before UTF-8 encoding", () => {
  const start = source.indexOf("function assertBackupText(value)");
  assert.notEqual(start, -1);
  const end = source.indexOf("\n}\n", start);
  const body = source.slice(start, end + 2);
  const characterGate = body.indexOf("value.length > MAX_SETTINGS_BACKUP_BYTES");
  const encoder = body.indexOf("new TextEncoder().encode(value).byteLength");
  assert.ok(characterGate >= 0);
  assert.ok(encoder > characterGate);
  assert.match(body, /bytes > MAX_SETTINGS_BACKUP_BYTES/);
});
