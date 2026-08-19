import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { discoverBuildInputRoots } from "../tools/build-input-discovery.mjs";

test("M1183 rejects duplicate canonical build-input root requests before traversal", async () => {
  const root = resolve(".");
  const child = resolve(root, "src");
  await assert.rejects(() => discoverBuildInputRoots(root, [child, child]), /Duplicate build input root directory/);
});

test("M1183 root requests must be absolute normalized platform paths", async () => {
  const root = resolve(".");
  await assert.rejects(() => discoverBuildInputRoots(root, ["src"]), /absolute normalized path/);
});
