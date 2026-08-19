import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner lifecycle listeners are captured and explicitly torn down", () => {
  assert.match(source, /const documentGetter = captureGetter\(globalThis, "document"\)/);
  assert.match(source, /const pageDocument = readGetter\(documentGetter, globalThis\)/);
  assert.match(source, /const addDocumentListener = captureMethod\(pageDocument, "addEventListener"\)/);
  assert.match(source, /const removeDocumentListener = captureMethod\(pageDocument, "removeEventListener"\)/);
  assert.match(source, /const addGlobalListener = captureMethod\(globalThis, "addEventListener"\)/);
  assert.match(source, /const removeGlobalListener = captureMethod\(globalThis, "removeEventListener"\)/);
  assert.match(source, /let domReadyHandler = null/);
  assert.match(source, /removeDocumentListener\("DOMContentLoaded", domReadyHandler\)/);
  assert.match(source, /removeGlobalListener\("pagehide", stop\)/);
  assert.match(source, /addDocumentListener\("DOMContentLoaded", domReadyHandler, \{ once: true \}\)/);
  assert.match(source, /addGlobalListener\("pagehide", stop, \{ once: true \}\)/);
  assert.doesNotMatch(source, /document\.addEventListener|globalThis\.addEventListener/);
});
