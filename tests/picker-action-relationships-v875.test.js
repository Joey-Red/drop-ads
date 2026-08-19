import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M875 picker actions publish keyboard and descriptive relationships", () => {
  assert.match(source, /id="save" type="button" aria-describedby="candidate message privacy">Hide on this site<\/button>/);
  assert.match(source, /id="cancel" type="button" aria-keyshortcuts="Escape" aria-describedby="message privacy">Cancel<\/button>/);
});
