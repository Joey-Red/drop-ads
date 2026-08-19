import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("reviewed multilingual necessary-only labels remain exact and conservative", () => {
  for (const phrase of [
    "nur notwendige", "nur notwendige cookies",
    "cookies necessaires uniquement", "necessaires uniquement",
    "solo cookies necesarias", "solo necesarias",
    "solo cookie necessari", "apenas cookies necessarios", "alleen noodzakelijke cookies"
  ]) assert.ok(source.includes(`[\"${phrase}\"`), `missing necessary-only phrase: ${phrase}`);
  assert.match(source, /\["nur notwendige", 86\]/);
  assert.match(source, /\["necessaires uniquement", 84\]/);
  assert.match(source, /\.normalize\("NFKD"\)/);
  assert.match(source, /if \(text === phrase\) return score/);
});
