import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectBuildInputs } from "../tools/build-info.mjs";

const root = resolve(import.meta.dirname, "..");

async function json(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

test("package lock matches package identity and stays dependency-free", async () => {
  const [pkg, lock] = await Promise.all([json("package.json"), json("package-lock.json")]);
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages?.[""]?.name, pkg.name);
  assert.equal(lock.packages?.[""]?.version, pkg.version);
  assert.deepEqual(Object.keys(lock.packages ?? {}).sort(), [""]);
  assert.equal(Object.hasOwn(pkg, "dependencies"), false);
  assert.equal(Object.hasOwn(pkg, "devDependencies"), false);
});

test("package-lock is bound into deterministic build inputs", async () => {
  const inputs = await collectBuildInputs(root);
  const paths = inputs.map((entry) => entry.path);
  assert.equal(paths.includes("package.json"), true);
  assert.equal(paths.includes("package-lock.json"), true);
});
