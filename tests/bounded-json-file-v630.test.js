import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readBoundedJsonFile } from "../tools/bounded-json-file.mjs";

test("bounded JSON reader accepts stable strict UTF-8 JSON", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-json-"));
  try {
    const path = join(root, "manifest.json");
    await writeFile(path, "{\"name\":\"Drop Ads\"}\n");
    assert.deepEqual(await readBoundedJsonFile(path, { maxBytes: 1024, label: "manifest" }), { name: "Drop Ads" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bounded JSON reader rejects oversized, malformed UTF-8, and malformed JSON inputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-json-"));
  try {
    const oversized = join(root, "oversized.json");
    await writeFile(oversized, "{\"value\":\"0123456789\"}");
    await assert.rejects(() => readBoundedJsonFile(oversized, { maxBytes: 8, label: "manifest" }), /byte size|byte limit/);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    await writeFile(invalidUtf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
    await assert.rejects(() => readBoundedJsonFile(invalidUtf8, { maxBytes: 1024, label: "manifest" }), /valid UTF-8/);

    const malformed = join(root, "malformed.json");
    await writeFile(malformed, "{not-json}\n");
    await assert.rejects(() => readBoundedJsonFile(malformed, { maxBytes: 1024, label: "manifest" }), /valid JSON/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
