import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { auditSourceText, collectSourceTextPaths, validateTextBytes } from "../tools/source-text-audit.mjs";

const encoder = new TextEncoder();

test("valid LF UTF-8 text passes", () => {
  assert.equal(validateTextBytes(encoder.encode("hello\nworld\n")), true);
  assert.equal(validateTextBytes(new Uint8Array()), true);
  assert.equal(validateTextBytes(encoder.encode("snowman ☃\n")), true);
});

test("CRLF and lone CR are rejected", () => {
  assert.throws(() => validateTextBytes(encoder.encode("a\r\nb\n")), /CR\/CRLF/);
  assert.throws(() => validateTextBytes(encoder.encode("a\rb\n")), /CR\/CRLF/);
});

test("UTF-8 BOM is rejected", () => {
  assert.throws(() => validateTextBytes(Uint8Array.from([0xef, 0xbb, 0xbf, 0x61, 0x0a])), /BOM/);
});

test("malformed UTF-8 is rejected with fatal decoding", () => {
  assert.throws(() => validateTextBytes(Uint8Array.from([0xc3, 0x28, 0x0a])), /not valid UTF-8/);
});

test("NUL and missing final LF are rejected", () => {
  assert.throws(() => validateTextBytes(Uint8Array.from([0x61, 0x00, 0x0a])), /NUL/);
  assert.throws(() => validateTextBytes(encoder.encode("no newline")), /end with LF/);
});

test("current release-relevant source inputs pass and include checkout metadata", async () => {
  const root = resolve(import.meta.dirname, "..");
  const paths = await collectSourceTextPaths(root);
  assert.equal(paths.some((path) => path.endsWith(".gitattributes")), true);
  assert.equal(paths.some((path) => path.endsWith("package-lock.json")), true);
  const result = await auditSourceText(root);
  assert.ok(result.files > 0);
});
