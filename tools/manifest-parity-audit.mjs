import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const REVIEWED_EXTENSION_CSP = "script-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none';";

function sortedStrings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`${label} must be an array of strings`);
  return [...value].sort();
}

function backgroundContract(manifest, browser) {
  const background = manifest?.background;
  if (!background || typeof background !== "object" || background.type !== "module") throw new Error(`${browser}.background must be a module background`);
  if (browser === "chromium") {
    if (background.service_worker !== "background.js") throw new Error("chromium.background.service_worker drifted");
    if (Object.hasOwn(background, "scripts")) throw new Error("chromium.background must not use scripts array");
  } else {
    if (!Array.isArray(background.scripts) || background.scripts.length !== 1 || background.scripts[0] !== "background.js") {
      throw new Error("firefox.background.scripts drifted");
    }
    if (Object.hasOwn(background, "service_worker")) throw new Error("firefox.background must not use service_worker compatibility path");
  }
  return { entry: "background.js", type: "module" };
}

function contentScriptContract(manifest, browser) {
  if (!Array.isArray(manifest.content_scripts)) throw new Error(`${browser}.content_scripts must be an array`);
  return manifest.content_scripts.map((script, index) => {
    if (!script || typeof script !== "object") throw new Error(`${browser}.content_scripts[${index}] is invalid`);
    return {
      matches: sortedStrings(script.matches, `${browser}.content_scripts[${index}].matches`),
      js: Array.isArray(script.js) ? [...script.js] : [],
      css: Array.isArray(script.css) ? [...script.css] : [],
      run_at: script.run_at ?? null,
      all_frames: script.all_frames === true
    };
  }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function cspContract(manifest, browser) {
  const csp = manifest?.content_security_policy;
  if (!csp || typeof csp !== "object" || Array.isArray(csp)) throw new Error(`${browser}.content_security_policy is missing`);
  if (csp.extension_pages !== REVIEWED_EXTENSION_CSP) throw new Error(`${browser}.content_security_policy.extension_pages drifted`);
  if (Object.hasOwn(csp, "sandbox")) throw new Error(`${browser}.content_security_policy.sandbox is not reviewed`);
  return { extension_pages: csp.extension_pages };
}

function canonicalCore(manifest, browser) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new Error(`${browser} manifest must be an object`);
  return {
    manifest_version: manifest.manifest_version,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    permissions: sortedStrings(manifest.permissions, `${browser}.permissions`),
    host_permissions: sortedStrings(manifest.host_permissions, `${browser}.host_permissions`),
    content_security_policy: cspContract(manifest, browser),
    background: backgroundContract(manifest, browser),
    action: {
      default_title: manifest.action?.default_title ?? null,
      default_popup: manifest.action?.default_popup ?? null
    },
    options_ui: {
      page: manifest.options_ui?.page ?? null,
      open_in_tab: manifest.options_ui?.open_in_tab === true
    },
    content_scripts: contentScriptContract(manifest, browser)
  };
}

function assertFirefoxCompatibilityExceptions(manifest) {
  const dnr = manifest.declarative_net_request;
  const expectedDnr = { rule_resources: [{ id: "bootstrap", enabled: true, path: "rules/static.json" }] };
  if (JSON.stringify(dnr) !== JSON.stringify(expectedDnr)) throw new Error("firefox.declarative_net_request compatibility contract drifted");

  const expectedGecko = { id: "drop-ads@local.invalid", strict_min_version: "128.0" };
  if (JSON.stringify(manifest.browser_specific_settings?.gecko) !== JSON.stringify(expectedGecko)) {
    throw new Error("firefox.browser_specific_settings.gecko compatibility contract drifted");
  }
}

export function auditManifestParity(chromium, firefox) {
  const left = canonicalCore(chromium, "chromium");
  const right = canonicalCore(firefox, "firefox");

  for (const field of Object.keys(left)) {
    if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) {
      throw new Error(`Cross-browser manifest parity drift at ${field}`);
    }
  }

  if (Object.hasOwn(chromium, "declarative_net_request")) throw new Error("chromium.declarative_net_request must remain absent from the compatibility baseline");
  if (Object.hasOwn(chromium, "browser_specific_settings")) throw new Error("chromium.browser_specific_settings must remain absent");
  assertFirefoxCompatibilityExceptions(firefox);

  return Object.freeze({ name: left.name, version: left.version, permissions: left.permissions.length });
}

export async function auditManifestFiles(rootDirectory) {
  const root = resolve(rootDirectory);
  const [chromium, firefox] = await Promise.all([
    readFile(resolve(root, "manifests", "chromium.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "manifests", "firefox.json"), "utf8").then(JSON.parse)
  ]);
  return auditManifestParity(chromium, firefox);
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditManifestFiles(root)
    .then((result) => console.log(`Cross-browser manifest parity passed (${result.name}@${result.version}).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
