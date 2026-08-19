import assert from "node:assert/strict";
import test from "node:test";
import { parseQualificationPort, snapshotQualificationServerOptions } from "../tools/qualification-server-options.mjs";

for (const [input, expected] of [[0, 0], [41731, 41731], ["0", 0], ["41731", 41731], ["65535", 65535]]) {
  test(`qualification fixture accepts port ${String(input)}`, () => {
    assert.equal(parseQualificationPort(input), expected);
  });
}

for (const input of [-1, 65536, "01", "1e3", " 41731", "41731 ", "", NaN, 1.5]) {
  test(`qualification fixture rejects port ${String(input)}`, () => {
    assert.throws(() => parseQualificationPort(input));
  });
}

test("qualification fixture options reject accessors without executing them", () => {
  let calls = 0;
  const options = {};
  Object.defineProperty(options, "port", {
    enumerable: true,
    get() {
      calls += 1;
      return 41731;
    }
  });
  assert.throws(() => snapshotQualificationServerOptions(options, 41731), /data field/);
  assert.equal(calls, 0);
});

test("qualification fixture options reject extra fields", () => {
  assert.throws(() => snapshotQualificationServerOptions({ port: 41731, quiet: false, host: "0.0.0.0" }, 41731), /fields are invalid/);
});
