import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M842 selector generation captures one document query collaborator", () => {
  assert.match(source, /function captureDocumentQuery\(documentRef\)/);
  assert.match(source, /querySelectorAll = documentRef\?\.querySelectorAll/);
  assert.match(source, /Reflect\.apply\(querySelectorAll, documentRef, \[selector\]\)/);
  assert.match(source, /const documentQuery = captureDocumentQuery\(documentRef\)/);
  assert.match(source, /if \(!documentQuery\) throw new Error\("Picker document query is unavailable"\)/);
  assert.match(source, /return documentQuery\(selector, expectedElement\)/);
});
