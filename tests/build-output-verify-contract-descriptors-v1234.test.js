import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1234 snapshots verifier contract entries through own data descriptors", () => {
  const helper = source.indexOf("function snapshotVerificationContractSource(source, browser)");
  const keys = source.indexOf("Reflect.ownKeys(source)", helper);
  const length = source.indexOf("Object.getOwnPropertyDescriptor(source, \"length\")", keys);
  const descriptor = source.indexOf("Object.getOwnPropertyDescriptor(source, key)", length);
  const value = source.indexOf("values[index] = descriptor.value", descriptor);
  const canonical = source.indexOf("assertCanonicalVerificationRelativePath(source[index]", value);
  assert.ok(helper >= 0);
  assert.ok(keys > helper);
  assert.ok(length > keys);
  assert.ok(descriptor > length);
  assert.ok(value > descriptor);
  assert.ok(canonical > value, "contract values may be consumed only after descriptor-safe snapshotting");
  assert.match(source, /generated verification contract must be dense and field-exact/);
  assert.match(source, /generated verification contract must not contain holes/);
  assert.match(source, /generated verification contract entries must be string data fields/);
});
