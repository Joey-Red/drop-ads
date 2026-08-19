import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CANONICAL_CONTENT_SCRIPTS } from "./manifest-content-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const expectedPermissions = ["alarms", "contextMenus", "declarativeNetRequest", "storage"];
const expectedHostPermissions = ["<all_urls>"];
const expectedExtensionCsp = "script-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none';";
const manifests = [["chromium", resolve(root, "manifests/chromium.json")], ["firefox", resolve(root, "manifests/firefox.json")]];

function sortedStrings(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
  return [...value].sort();
}

function sameStrings(actual, expected) {
  const normalized = sortedStrings(actual);
  return normalized !== null && JSON.stringify(normalized) === JSON.stringify(expected);
}

const violations = [];
for (const [browser, path] of manifests) {
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (manifest.manifest_version !== 3) violations.push(`${browser}: manifest_version must remain 3`);
  if (!sameStrings(manifest.permissions, expectedPermissions)) violations.push(`${browser}: permissions changed; expected exactly ${expectedPermissions.join(", ")}`);
  if (!sameStrings(manifest.host_permissions, expectedHostPermissions)) violations.push(`${browser}: host_permissions changed; expected exactly <all_urls>`);
  if (manifest.optional_permissions != null || manifest.optional_host_permissions != null) violations.push(`${browser}: optional permissions require explicit privacy review`);
  if (JSON.stringify(manifest.content_scripts) !== JSON.stringify(CANONICAL_CONTENT_SCRIPTS)) violations.push(`${browser}: content_scripts changed from the reviewed picker/cosmetic and cookie-banner runtime stacks`);
  if (manifest.externally_connectable != null) violations.push(`${browser}: externally_connectable requires explicit privacy review`);
  const csp = manifest.content_security_policy;
  if (!csp || typeof csp !== "object" || Array.isArray(csp) || csp.extension_pages !== expectedExtensionCsp || Object.hasOwn(csp, "sandbox")) {
    violations.push(`${browser}: extension-page CSP changed from the reviewed local-code-only policy`);
  }

  for (const forbidden of ["tabs", "cookies", "history", "webRequest", "webRequestBlocking", "webNavigation", "declarativeNetRequestFeedback", "scripting"]) {
    if (manifest.permissions?.includes(forbidden)) violations.push(`${browser}: forbidden/unneeded permission declared: ${forbidden}`);
  }

  if (browser === "firefox") {
    const resources = manifest.declarative_net_request?.rule_resources;
    const bootstrap = Array.isArray(resources) && resources.find((item) => item?.id === "bootstrap");
    if (!bootstrap || bootstrap.enabled !== true || bootstrap.path !== "rules/static.json") violations.push("firefox: enabled bootstrap static DNR ruleset must remain declared");
  } else if (manifest.declarative_net_request != null) {
    violations.push("chromium: unexpected static DNR ruleset declaration");
  }
}

if (violations.length) {
  console.error("Manifest permission audit failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest permission audit passed: permissions, reviewed content scripts, and local-code-only CSP remain exact.");
}
