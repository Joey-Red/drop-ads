import test from "node:test";
import assert from "node:assert/strict";
import {
  LIST_SCHEMA_VERSION,
  MAX_NATIVE_LIST_ID_CHARS,
  MAX_NATIVE_LIST_TITLE_CHARS,
  NATIVE_LIST_FORMAT,
  parseList,
  parseNativeList,
  parseThirdPartyList,
  validateListMetadata
} from "../src/core/lists.js";

test("native lists parse block and allow rules strictly", () => {
  const parsed = parseNativeList(`
# comment
block domain Ads.Example.com
allow url https://example.com/needed.js#fragment
block pattern ||tracker.example^
`);
  assert.deepEqual(parsed.block, [
    { kind: "domain", value: "ads.example.com" },
    { kind: "pattern", value: "||tracker.example^" }
  ]);
  assert.deepEqual(parsed.allow, [{ kind: "url", value: "https://example.com/needed.js" }]);
});

test("native lists reject unknown, broad, and private/local targets", () => {
  assert.throws(() => parseNativeList("maybe-block ads.example.com"), /line 1/);
  assert.throws(() => parseNativeList("block pattern *"), /too broad/);

  for (const rule of [
    "block domain 192.168.1.1",
    "block domain router.local",
    "block domain service.home.arpa",
    "block url http://127.0.0.1/admin",
    "block url http://10.1.2.3/pixel",
    "block url http://[::1]/admin",
    "block url http://[fd00::1]/pixel",
    "block url http://[fe80::1]/pixel",
    "block url https://intranet/admin",
    "block pattern ||192.168.50.10^",
    "block pattern ||router.local^",
    "block pattern http://[fd12::42]/ads/*",
    "block pattern ||intranet^",
    "block pattern ||intranet:8443^",
    "block pattern https://intranet/ads/*"
  ]) {
    assert.throws(() => parseNativeList(rule), /local\/private/);
  }
});

test("native remote rules continue accepting ordinary public targets", () => {
  const parsed = parseNativeList(`
block domain ads.example.com
block url https://cdn.example.com/ad.js
block pattern ||tracker.example/ads/*
block pattern ||tracker.example:8443^
`);
  assert.deepEqual(parsed.block, [
    { kind: "domain", value: "ads.example.com" },
    { kind: "url", value: "https://cdn.example.com/ad.js" },
    { kind: "pattern", value: "||tracker.example/ads/*" },
    { kind: "pattern", value: "||tracker.example:8443^" }
  ]);
});

test("native exact URLs reject embedded credentials before they can enter cache", () => {
  assert.throws(() => parseNativeList("block url https://user:secret@example.com/ad.js"), /credentials/);
});

test("third-party lists import common network rules and skip unsupported or dangerous syntax", () => {
  const parsed = parseThirdPartyList(`
! EasyList-style comment
||ads.example.com^
@@||needed.example.com^
0.0.0.0 telemetry.example.com
example.net
news.example##.advert
||tracker.example^$third-party
*
0.0.0.0 192.168.1.1
`);
  assert.deepEqual(parsed.block, [
    { kind: "domain", value: "ads.example.com" },
    { kind: "domain", value: "telemetry.example.com" },
    { kind: "domain", value: "example.net" }
  ]);
  assert.deepEqual(parsed.allow, [{ kind: "domain", value: "needed.example.com" }]);
  assert.equal(parsed.unsupportedCount, 4);
});

test("third-party private/local and single-label intranet rules are skipped rather than activated", () => {
  const parsed = parseThirdPartyList(`
||127.0.0.1^
|http://192.168.1.1/ad.js|
||printer.local^
http://[fd00::1]/ads/*
|https://intranet/private.js|
||intranet^
||intranet:8443^
https://intranet/ads/*
||public.example^
`);
  assert.deepEqual(parsed.block, [{ kind: "domain", value: "public.example" }]);
  assert.equal(parsed.unsupportedCount, 8);
});

test("third-party patterns remain data and never executable code", () => {
  const parsed = parseThirdPartyList("||cdn.example.com/ads/*");
  assert.deepEqual(parsed.block, [{ kind: "pattern", value: "||cdn.example.com/ads/*" }]);
});

test("native metadata accepts only the exact reviewed schema and format", () => {
  const metadata = {
    schemaVersion: LIST_SCHEMA_VERSION,
    id: "drop-ads-default",
    title: " Drop Ads Default ",
    format: NATIVE_LIST_FORMAT
  };
  assert.deepEqual(validateListMetadata(metadata), {
    schemaVersion: LIST_SCHEMA_VERSION,
    id: "drop-ads-default",
    title: "Drop Ads Default",
    format: NATIVE_LIST_FORMAT
  });

  for (const extra of [
    { sourceUrl: "https://example.com/list.txt" },
    { pageUrl: "https://private.example/" },
    { requestHistory: ["private.example"] },
    { analytics: true }
  ]) {
    assert.throws(() => validateListMetadata({ ...metadata, ...extra }), /unsupported field/);
  }
  assert.throws(() => validateListMetadata({ ...metadata, format: "hosts" }), /format/);
  assert.throws(() => validateListMetadata({ ...metadata, schemaVersion: LIST_SCHEMA_VERSION + 1 }), /schema version/);
  assert.throws(() => validateListMetadata([metadata]), /plain object/);
});

test("native metadata id/title bounds accept the boundary and reject one-over", () => {
  const base = { schemaVersion: LIST_SCHEMA_VERSION, format: NATIVE_LIST_FORMAT };
  const id = `a${"b".repeat(MAX_NATIVE_LIST_ID_CHARS - 1)}`;
  const title = "T".repeat(MAX_NATIVE_LIST_TITLE_CHARS);
  assert.equal(validateListMetadata({ ...base, id, title }).id.length, MAX_NATIVE_LIST_ID_CHARS);
  assert.equal(validateListMetadata({ ...base, id, title }).title.length, MAX_NATIVE_LIST_TITLE_CHARS);
  assert.throws(() => validateListMetadata({ ...base, id: `${id}x`, title: "X" }), /id/);
  assert.throws(() => validateListMetadata({ ...base, id: "valid", title: `${title}X` }), /title/);
});

test("native metadata requires every field with the correct type", () => {
  const valid = { schemaVersion: LIST_SCHEMA_VERSION, id: "drop-ads-default", title: "Drop Ads", format: NATIVE_LIST_FORMAT };
  for (const key of ["schemaVersion", "id", "title", "format"]) {
    const missing = { ...valid };
    delete missing[key];
    assert.throws(() => validateListMetadata(missing));
  }
  assert.throws(() => validateListMetadata({ ...valid, id: 7 }), /id/);
  assert.throws(() => validateListMetadata({ ...valid, title: [] }), /title/);
});

test("parseList dispatches only recognized formats", () => {
  assert.deepEqual(parseList("block domain ads.example.com", NATIVE_LIST_FORMAT).block, [{ kind: "domain", value: "ads.example.com" }]);
  assert.throws(() => parseList("x", "javascript"), /Unsupported list format/);
});

