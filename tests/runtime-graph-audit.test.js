import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { auditRuntimeGraph } from "../tools/runtime-graph-audit.mjs";

async function write(root, path, content) {
  await mkdir(join(root, dirname(path)), { recursive: true });
  await writeFile(join(root, path), content);
}

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-runtime-graph-"));
  try {
    await write(root, "src/background.js", 'import { helper } from "./core/helper.js";\nhelper();\n');
    await write(root, "src/core/helper.js", 'export function helper() {}\n');
    await write(root, "src/content/content.js", '(() => {})();\n');
    await write(root, "src/options/index.html", '<link rel="stylesheet" href="options.css"><script type="module" src="options.js"></script>\n');
    await write(root, "src/options/options.css", 'body {}\n');
    await write(root, "src/options/options.js", 'import { helper } from "../core/helper.js"; helper();\n');
    await write(root, "src/popup/index.html", '<script type="module" src="popup.js"></script>\n');
    await write(root, "src/popup/popup.js", 'export const popup = true;\n');
    await write(root, "src/rules/static.json", '[]\n');
    const chromium = {
      manifest_version: 3,
      background: { service_worker: "background.js", type: "module" },
      action: { default_popup: "popup/index.html" },
      options_ui: { page: "options/index.html" },
      content_scripts: [{ matches: ["<all_urls>"], js: ["content/content.js"] }]
    };
    const firefox = {
      ...chromium,
      background: { scripts: ["background.js"], type: "module" },
      declarative_net_request: { rule_resources: [{ id: "bootstrap", enabled: true, path: "rules/static.json" }] }
    };
    await write(root, "manifests/chromium.json", `${JSON.stringify(chromium)}\n`);
    await write(root, "manifests/firefox.json", `${JSON.stringify(firefox)}\n`);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("valid local runtime graph passes", async () => {
  await fixture(async (root) => {
    const result = await auditRuntimeGraph(root);
    assert.ok(result.javascriptFiles >= 4);
    assert.equal(result.htmlFiles, 2);
  });
});

test("missing and escaping module targets fail closed", async () => {
  await fixture(async (root) => {
    await write(root, "src/background.js", 'import "./core/missing.js";\n');
    await assert.rejects(auditRuntimeGraph(root), /module import target is missing/);
    await write(root, "src/background.js", 'import "../outside.js";\n');
    await assert.rejects(auditRuntimeGraph(root), /escapes shipped src tree/);
  });
});

test("remote, bare, and dynamic module loading are rejected", async () => {
  await fixture(async (root) => {
    for (const [source, pattern] of [
      ['import "https://cdn.example/code.js";\n', /relative local path/],
      ['import "some-package";\n', /relative local path/],
      ['const module = import(".\/core\/helper.js");\n', /dynamic import\(\) is forbidden/]
    ]) {
      await write(root, "src/background.js", source);
      await assert.rejects(auditRuntimeGraph(root), pattern);
    }
  });
});

test("HTML remote/missing assets and inline executable script are rejected", async () => {
  await fixture(async (root) => {
    await write(root, "src/options/index.html", '<script src="https://cdn.example/app.js"></script>\n');
    await assert.rejects(auditRuntimeGraph(root), /script src must be a local relative asset/);
    await write(root, "src/options/index.html", '<link rel="stylesheet" href="missing.css">\n');
    await assert.rejects(auditRuntimeGraph(root), /stylesheet href target is missing/);
    await write(root, "src/options/index.html", '<script>window.bad = true;</script>\n');
    await assert.rejects(auditRuntimeGraph(root), /executable inline script is forbidden/);
  });
});

test("missing manifest runtime entry fails closed", async () => {
  await fixture(async (root) => {
    const manifest = JSON.parse(await (await import("node:fs/promises")).readFile(join(root, "manifests/chromium.json"), "utf8"));
    manifest.background.service_worker = "missing-background.js";
    await write(root, "manifests/chromium.json", `${JSON.stringify(manifest)}\n`);
    await assert.rejects(auditRuntimeGraph(root), /chromium manifest: runtime reference target is missing/);
  });
});
