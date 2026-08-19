import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("M827 ships pending Settings semantic helpers through the loaded list-filter entrypoint", () => {
  const html = read("src/options/index.html");
  const entry = read("src/options/list-filter.js");

  assert.match(html, /<script type="module" src="list-filter\.js"><\/script>/);
  for (const modulePath of [
    "mutation-target-semantics.js",
    "disabled-site-feedback.js",
    "subscription-presentation.js"
  ]) {
    assert.match(entry, new RegExp(`import \\"\\./${modulePath.replaceAll(".", "\\.")}\\";`));
    assert.ok(fs.existsSync(new URL(`src/options/${modulePath}`, root)), `${modulePath} must exist`);
  }

  const mutationTargets = read("src/options/mutation-target-semantics.js");
  assert.match(mutationTargets, /import "\.\/personal-mutation-feedback\.js";/);
});
