import test from "node:test";
import assert from "node:assert/strict";
import { parseSettingsBackup, SETTINGS_BACKUP_FORMAT } from "../src/core/settings-backup.js";

test("settings backup version rejection never coerces hostile objects", () => {
  let toStringCalls = 0;
  let primitiveCalls = 0;
  const version = {
    toString() { toStringCalls += 1; return "1"; },
    [Symbol.toPrimitive]() { primitiveCalls += 1; return 1; }
  };
  assert.throws(
    () => parseSettingsBackup({ format: SETTINGS_BACKUP_FORMAT, version, settings: {} }),
    /Unsupported settings backup version/
  );
  assert.equal(toStringCalls, 0);
  assert.equal(primitiveCalls, 0);
});

test("unsupported primitive versions use static rejection text", () => {
  assert.throws(
    () => parseSettingsBackup({ format: SETTINGS_BACKUP_FORMAT, version: 2, settings: {} }),
    (error) => error instanceof Error && error.message === "Unsupported settings backup version"
  );
});
