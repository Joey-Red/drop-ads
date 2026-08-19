import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const expectedKeys = Object.freeze({
  chromium: Object.freeze([
    "action", "background", "content_scripts", "content_security_policy", "description",
    "host_permissions", "manifest_version", "name", "options_ui", "permissions", "version"
  ]),
  firefox: Object.freeze([
    "action", "background", "browser_specific_settings", "content_scripts", "content_security_policy",
    "declarative_net_request", "description", "host_permissions", "manifest_version", "name",
    "options_ui", "permissions", "version"
  ])
});
const violations = [];

for (const browser of ["chromium", "firefox"]) {
  const manifest = JSON.parse(await readFile(resolve(root, `manifests/${browser}.json`), "utf8"));
  const keys = Object.keys(manifest).sort();
  const expected = [...expectedKeys[browser]].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    violations.push(`${browser}: top-level manifest surface changed; explicit privacy/release review required`);
  }
}

if (violations.length) {
  console.error("Manifest surface audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest surface audit passed: Chromium and Firefox expose only reviewed top-level manifest keys.");
}
