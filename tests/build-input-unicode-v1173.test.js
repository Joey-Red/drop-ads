import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertCanonicalBuildInputPath } from "../tools/build-input-discovery.mjs";

const discovery = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");

test("M1173 accepts canonical NFC Unicode paths", () => {
  assert.equal(assertCanonicalBuildInputPath("src/café.js"), "src/café.js");
  assert.equal(assertCanonicalBuildInputPath("src/emoji-😀.js"), "src/emoji-😀.js");
});

test("M1173 rejects malformed, decomposed, and control-bearing provenance paths", () => {
  assert.throws(() => assertCanonicalBuildInputPath("src/cafe\u0301.js"), /NFC Unicode normalization/);
  assert.throws(() => assertCanonicalBuildInputPath("src/bad\nname.js"), /unsafe control text/);
  assert.throws(() => assertCanonicalBuildInputPath("src/bad\ud800.js"), /well-formed Unicode/);
  assert.match(discovery, /value\.normalize\("NFC"\) !== value/);
  assert.match(discovery, /UNSAFE_BUILD_INPUT_PATH_TEXT/);
  assert.match(discovery, /isWellFormedBuildInputText/);
});
