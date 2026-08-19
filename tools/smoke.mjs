import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BUILD_INFO_SCHEMA_VERSION, createBuildInfo } from "./build-info.mjs";
import { verifyBuiltExtensionsContent } from "./build-output-verify.mjs";

const root = resolve(import.meta.dirname, "..");
const requiredPermissions = ["declarativeNetRequest", "storage", "contextMenus", "alarms"];

async function manifestFor(browser) {
  return JSON.parse(await readFile(resolve(root, "dist", browser, "manifest.json"), "utf8"));
}

async function buildInfoFor(browser) {
  return JSON.parse(await readFile(resolve(root, "dist", browser, "build-info.json"), "utf8"));
}

async function exists(browser, path) {
  await access(resolve(root, "dist", browser, path));
}

const generatedContent = await verifyBuiltExtensionsContent(root);

for (const browser of ["chromium", "firefox"]) {
  const manifest = await manifestFor(browser);
  assert.equal(manifest.manifest_version, 3, `${browser}: Manifest V3 required`);
  assert.deepEqual(manifest.host_permissions, ["<all_urls>"], `${browser}: host permissions changed unexpectedly`);
  for (const permission of requiredPermissions) assert.equal(manifest.permissions.includes(permission), true, `${browser}: missing ${permission}`);
  assert.equal(manifest.permissions.includes("cookies"), false, `${browser}: cookie-jar permission must not be present`);
  for (const path of ["background.js", "popup/index.html", "options/index.html", "lists/default.txt", "lists/default.meta.json", "build-info.json"]) await exists(browser, path);
}

const chromium = await manifestFor("chromium");
assert.equal(chromium.background.service_worker, "background.js");
assert.equal(chromium.background.type, "module");

const firefox = await manifestFor("firefox");
assert.deepEqual(firefox.background.scripts, ["background.js"]);
assert.equal(typeof firefox.browser_specific_settings?.gecko?.id, "string");
assert.equal(firefox.declarative_net_request?.rule_resources?.[0]?.enabled, true);
assert.equal(firefox.declarative_net_request?.rule_resources?.[0]?.path, "rules/static.json");
await exists("firefox", "rules/static.json");

const chromiumBuildInfo = await buildInfoFor("chromium");
const firefoxBuildInfo = await buildInfoFor("firefox");
const expectedBuildInfo = await createBuildInfo(root);
assert.equal(chromiumBuildInfo.schemaVersion, BUILD_INFO_SCHEMA_VERSION);
assert.deepEqual(chromiumBuildInfo, firefoxBuildInfo, "Firefox and Chromium must carry identical source build identity");
assert.deepEqual(chromiumBuildInfo, expectedBuildInfo, "dist build identity must match current source inputs");
assert.equal(generatedContent.sourceFingerprint, expectedBuildInfo.sourceFingerprint);
assert.match(chromiumBuildInfo.sourceFingerprint, /^sha256:[0-9a-f]{64}$/);
assert.equal(Object.hasOwn(chromiumBuildInfo, "timestamp"), false);
assert.equal(Object.hasOwn(chromiumBuildInfo, "hostname"), false);
assert.equal(Object.hasOwn(chromiumBuildInfo, "username"), false);

console.log(`Browser package smoke checks passed (${chromiumBuildInfo.sourceFingerprint})`);
