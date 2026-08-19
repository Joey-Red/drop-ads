import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/artifact-audit.mjs", import.meta.url), "utf8");

test("M1231 snapshots generated allowlist source through bounded own descriptors", () => {
  const helper = source.indexOf("function snapshotGeneratedAllowlistSource(source, browser)");
  const keys = source.indexOf("Reflect.ownKeys(source)", helper);
  const length = source.indexOf('Object.getOwnPropertyDescriptor(source, "length")', keys);
  const ceiling = source.indexOf("MAX_GENERATED_TREE_ALLOWLIST_FILES", length);
  const indexDescriptor = source.indexOf("Object.getOwnPropertyDescriptor(source, String(index))", ceiling);
  const freeze = source.indexOf("return Object.freeze(snapshot)", indexDescriptor);
  const consumer = source.indexOf("snapshotGeneratedAllowlistSource(generatedExtensionFilesForBrowser(targetBrowser), targetBrowser)", freeze);

  assert.ok(helper >= 0);
  assert.ok(keys > helper, "own keys must be snapshotted before entries are consumed");
  assert.ok(length > keys, "length must be read through its own descriptor");
  assert.ok(ceiling > length, "descriptor admission must retain the reviewed member ceiling");
  assert.ok(indexDescriptor > ceiling, "entries must be read through own descriptors");
  assert.ok(freeze > indexDescriptor, "descriptor values must be frozen before downstream use");
  assert.ok(consumer > freeze, "allowlist construction must consume only the descriptor-safe snapshot");

  assert.match(source, /keys\.length !== length \+ 1/);
  assert.match(source, /allowlist contains unsupported own key/);
  assert.match(source, /allowlist index is not canonical/);
  assert.match(source, /allowlist entries must be string data fields/);
});
