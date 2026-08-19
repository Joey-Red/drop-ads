import test from "node:test";
import assert from "node:assert/strict";
import { auditManifestParity, REVIEWED_EXTENSION_CSP } from "../tools/manifest-parity-audit.mjs";

function chromiumManifest() {
  return {
    manifest_version: 3,
    name: "drop-ads",
    version: "0.1.0",
    description: "Privacy-first browser-local network blocking. No telemetry.",
    permissions: ["declarativeNetRequest", "storage", "contextMenus", "alarms"],
    host_permissions: ["<all_urls>"],
    content_security_policy: { extension_pages: REVIEWED_EXTENSION_CSP },
    content_scripts: [{
      matches: ["http://*/*", "https://*/*"],
      js: ["content/message-contract.js", "content/selector-utils.js", "content/cosmetic.js", "content/picker.js", "content/context-cleanup.js"],
      run_at: "document_start",
      all_frames: true
    }],
    background: { service_worker: "background.js", type: "module" },
    action: { default_title: "drop-ads", default_popup: "popup/index.html" },
    options_ui: { page: "options/index.html", open_in_tab: true }
  };
}

function firefoxManifest() {
  const chromium = chromiumManifest();
  delete chromium.background;
  return {
    ...chromium,
    declarative_net_request: { rule_resources: [{ id: "bootstrap", enabled: true, path: "rules/static.json" }] },
    background: { scripts: ["background.js"], type: "module" },
    browser_specific_settings: { gecko: { id: "drop-ads@local.invalid", strict_min_version: "128.0" } }
  };
}

test("current Firefox/Chromium security and runtime surfaces are equivalent", () => {
  assert.deepEqual(auditManifestParity(chromiumManifest(), firefoxManifest()), { name: "drop-ads", version: "0.1.0", permissions: 4 });
});

test("permission and host-permission drift fail with field-specific errors", () => {
  const firefoxPermissions = firefoxManifest();
  firefoxPermissions.permissions.push("tabs");
  assert.throws(() => auditManifestParity(chromiumManifest(), firefoxPermissions), /parity drift at permissions/);

  const firefoxHosts = firefoxManifest();
  firefoxHosts.host_permissions = ["https://example.com/*"];
  assert.throws(() => auditManifestParity(chromiumManifest(), firefoxHosts), /parity drift at host_permissions/);
});

test("content script JavaScript order and scope drift are rejected", () => {
  const reordered = firefoxManifest();
  reordered.content_scripts[0].js = [...reordered.content_scripts[0].js].reverse();
  assert.throws(() => auditManifestParity(chromiumManifest(), reordered), /parity drift at content_scripts/);

  const frames = firefoxManifest();
  frames.content_scripts[0].all_frames = false;
  assert.throws(() => auditManifestParity(chromiumManifest(), frames), /parity drift at content_scripts/);
});

test("permission and match arrays compare order-insensitively", () => {
  const firefox = firefoxManifest();
  firefox.permissions.reverse();
  firefox.host_permissions.reverse();
  firefox.content_scripts[0].matches.reverse();
  assert.doesNotThrow(() => auditManifestParity(chromiumManifest(), firefox));
});

test("popup and options drift are rejected", () => {
  const popup = firefoxManifest();
  popup.action.default_popup = "popup/other.html";
  assert.throws(() => auditManifestParity(chromiumManifest(), popup), /parity drift at action/);

  const options = firefoxManifest();
  options.options_ui.open_in_tab = false;
  assert.throws(() => auditManifestParity(chromiumManifest(), options), /parity drift at options_ui/);
});

test("extension-page CSP must remain the exact local-code-only policy", () => {
  const missing = firefoxManifest();
  delete missing.content_security_policy;
  assert.throws(() => auditManifestParity(chromiumManifest(), missing), /content_security_policy is missing/);

  for (const unsafe of [
    "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'; base-uri 'none';",
    "script-src 'self' https://example.com; worker-src 'self'; object-src 'none'; base-uri 'none';",
    "script-src 'self' 'unsafe-eval'; worker-src 'self'; object-src 'none'; base-uri 'none';"
  ]) {
    const manifest = firefoxManifest();
    manifest.content_security_policy.extension_pages = unsafe;
    assert.throws(() => auditManifestParity(chromiumManifest(), manifest), /content_security_policy\.extension_pages drifted/);
  }

  const sandbox = firefoxManifest();
  sandbox.content_security_policy.sandbox = "sandbox allow-scripts";
  assert.throws(() => auditManifestParity(chromiumManifest(), sandbox), /sandbox is not reviewed/);
});

test("only exact reviewed Firefox compatibility extras are accepted", () => {
  const dnr = firefoxManifest();
  dnr.declarative_net_request.rule_resources[0].path = "rules/other.json";
  assert.throws(() => auditManifestParity(chromiumManifest(), dnr), /declarative_net_request compatibility contract drifted/);

  const gecko = firefoxManifest();
  gecko.browser_specific_settings.gecko.strict_min_version = "127.0";
  assert.throws(() => auditManifestParity(chromiumManifest(), gecko), /gecko compatibility contract drifted/);
});
