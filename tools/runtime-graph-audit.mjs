import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

function normalizedPath(root, path) {
  return relative(root, path).split(sep).join("/");
}

function staysInside(root, path) {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

async function isRegularFile(path) {
  try { return (await stat(path)).isFile(); }
  catch { return false; }
}

async function walkFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export function extractStaticModuleSpecifiers(text) {
  const lines = String(text).split(/\r?\n/);
  const specifiers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trimStart();
    const importDeclaration = /^import\b/.test(trimmed) && !/^import\s*\(/.test(trimmed);
    const reExportDeclaration = /^export\s+(?:\{|\*)/.test(trimmed);
    if (!importDeclaration && !reExportDeclaration) continue;
    let statement = trimmed;
    let cursor = index;
    while (!statement.includes(";") && cursor + 1 < lines.length && cursor - index < 20) {
      cursor += 1;
      statement += `\n${lines[cursor]}`;
    }
    index = cursor;
    const sideEffect = /^import\s+["']([^"']+)["']/.exec(statement);
    const from = /\bfrom\s+["']([^"']+)["']/.exec(statement);
    const match = sideEffect ?? from;
    if (match) specifiers.push(match[1]);
  }
  return specifiers;
}

function forbiddenModuleSpecifier(specifier) {
  return !specifier.startsWith("./") && !specifier.startsWith("../");
}

async function validateModuleReference({ srcRoot, fromPath, specifier, violations }) {
  const display = normalizedPath(srcRoot, fromPath);
  if (forbiddenModuleSpecifier(specifier)) {
    violations.push(`${display}: module import must be a relative local path: ${specifier}`);
    return;
  }
  if (specifier.includes("?") || specifier.includes("#") || extname(specifier) !== ".js") {
    violations.push(`${display}: module import must target an explicit .js file without query/fragment: ${specifier}`);
    return;
  }
  const target = resolve(dirname(fromPath), specifier);
  if (!staysInside(srcRoot, target)) {
    violations.push(`${display}: module import escapes shipped src tree: ${specifier}`);
    return;
  }
  if (!await isRegularFile(target)) violations.push(`${display}: module import target is missing/not a regular file: ${specifier}`);
}

function attributeValue(attributes, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']+)["']|([^\\s>]+))`, "i");
  const match = pattern.exec(attributes);
  return match?.[1] ?? match?.[2] ?? null;
}

function localAssetPath(reference) {
  const value = String(reference).trim();
  if (!value || value.startsWith("/") || value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (value.includes("?") || value.includes("#")) return null;
  return value;
}

async function validateHtmlAsset({ srcRoot, htmlPath, reference, label, violations }) {
  const display = normalizedPath(srcRoot, htmlPath);
  const local = localAssetPath(reference);
  if (!local) {
    violations.push(`${display}: ${label} must be a local relative asset without scheme/query/fragment: ${reference}`);
    return;
  }
  const target = resolve(dirname(htmlPath), local);
  if (!staysInside(srcRoot, target)) {
    violations.push(`${display}: ${label} escapes shipped src tree: ${reference}`);
    return;
  }
  if (!await isRegularFile(target)) violations.push(`${display}: ${label} target is missing/not a regular file: ${reference}`);
}

async function auditHtmlFile(srcRoot, path, violations) {
  const text = await readFile(path, "utf8");
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const source = attributeValue(match[1], "src");
    if (!source) {
      if (match[2].trim()) violations.push(`${normalizedPath(srcRoot, path)}: executable inline script is forbidden`);
      continue;
    }
    await validateHtmlAsset({ srcRoot, htmlPath: path, reference: source, label: "script src", violations });
  }
  for (const match of text.matchAll(/<link\b([^>]*)>/gi)) {
    const relValue = attributeValue(match[1], "rel") ?? "";
    if (!relValue.split(/\s+/).some((value) => value.toLowerCase() === "stylesheet")) continue;
    const href = attributeValue(match[1], "href");
    if (!href) {
      violations.push(`${normalizedPath(srcRoot, path)}: stylesheet link is missing href`);
      continue;
    }
    await validateHtmlAsset({ srcRoot, htmlPath: path, reference: href, label: "stylesheet href", violations });
  }
}

async function validateManifestPath(srcRoot, manifestLabel, reference, violations) {
  const local = localAssetPath(reference);
  if (!local) {
    violations.push(`${manifestLabel}: runtime reference must be a local extension path without scheme/query/fragment: ${reference}`);
    return;
  }
  const target = resolve(srcRoot, local);
  if (!staysInside(srcRoot, target)) {
    violations.push(`${manifestLabel}: runtime reference escapes shipped src tree: ${reference}`);
    return;
  }
  if (!await isRegularFile(target)) violations.push(`${manifestLabel}: runtime reference target is missing/not a regular file: ${reference}`);
}

function manifestRuntimeReferences(manifest) {
  const refs = [];
  if (typeof manifest.background?.service_worker === "string") refs.push(manifest.background.service_worker);
  if (Array.isArray(manifest.background?.scripts)) refs.push(...manifest.background.scripts);
  if (typeof manifest.action?.default_popup === "string") refs.push(manifest.action.default_popup);
  if (typeof manifest.options_ui?.page === "string") refs.push(manifest.options_ui.page);
  for (const script of manifest.content_scripts ?? []) {
    if (Array.isArray(script?.js)) refs.push(...script.js);
    if (Array.isArray(script?.css)) refs.push(...script.css);
  }
  for (const ruleset of manifest.declarative_net_request?.rule_resources ?? []) {
    if (typeof ruleset?.path === "string") refs.push(ruleset.path);
  }
  return refs;
}

export async function auditRuntimeGraph(rootDirectory) {
  const root = resolve(rootDirectory);
  const srcRoot = resolve(root, "src");
  const violations = [];
  const files = await walkFiles(srcRoot);

  for (const path of files.filter((file) => extname(file) === ".js")) {
    const text = await readFile(path, "utf8");
    if (/\bimport\s*\(/.test(text)) violations.push(`${normalizedPath(srcRoot, path)}: dynamic import() is forbidden in shipped runtime source`);
    for (const specifier of extractStaticModuleSpecifiers(text)) {
      await validateModuleReference({ srcRoot, fromPath: path, specifier, violations });
    }
  }

  for (const path of files.filter((file) => extname(file) === ".html")) await auditHtmlFile(srcRoot, path, violations);

  for (const browser of ["chromium", "firefox"]) {
    const manifestPath = resolve(root, "manifests", `${browser}.json`);
    let manifest;
    try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
    catch (error) {
      violations.push(`${browser} manifest: could not parse manifest: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    for (const reference of manifestRuntimeReferences(manifest)) {
      await validateManifestPath(srcRoot, `${browser} manifest`, reference, violations);
    }
  }

  violations.sort();
  if (violations.length) throw new Error(`Runtime graph audit failed:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  return {
    javascriptFiles: files.filter((file) => extname(file) === ".js").length,
    htmlFiles: files.filter((file) => extname(file) === ".html").length
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(import.meta.dirname, "..");
  auditRuntimeGraph(root)
    .then((result) => console.log(`Runtime graph audit passed (${result.javascriptFiles} JS, ${result.htmlFiles} HTML source files).`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
