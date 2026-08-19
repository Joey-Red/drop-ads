import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "src");
const allowedExtensions = new Set([".js", ".json", ".html", ".css"]);

const forbiddenPatterns = [
  { label: "browsing history API", pattern: /\b(?:browser|chrome)\.history\b/ },
  { label: "webNavigation observation API", pattern: /\b(?:browser|chrome)\.webNavigation\b/ },
  { label: "webRequest observation API", pattern: /\b(?:browser|chrome)\.webRequest\b/ },
  { label: "remote beacon API", pattern: /\bnavigator\.sendBeacon\b/ },
  { label: "analytics/telemetry client identifier", pattern: /\b(?:telemetry|analytics?)(?:Client|Service|Event|Endpoint|Url|URL|Key|Id|ID)\b/i },
  { label: "known analytics SDK identifier", pattern: /\b(?:gtag|mixpanel|amplitude|posthog|segmentAnalytics)\b/i },
  { label: "tracking-style state key", pattern: /\b(?:requestHistory|browsingHistory|blockedCount|requestCount|userIdentifier|deviceIdentifier|elementHistory|domHistory|pageHtml|domSnapshot)\b/i }
];

const allowedRemoteHosts = new Set(["raw.githubusercontent.com", "github.com"]);
const remoteUrlPattern = /https:\/\/[^\s"'`<>\\)]+/g;
const htmlRemoteAttributePattern = /\b(?:src|href|action|formaction|poster|data)\s*=\s*(["'])(https:\/\/[^"']+)\1/gi;
const cssRemoteReferencePattern = /(?:\burl\s*\(\s*(["']?)(https:\/\/[^"')\s]+)\1\s*\)|@import\s+(?:url\s*\(\s*)?(["'])(https:\/\/[^"']+)\3)/gi;
const comparableBaseSentinel = "https://invalid.local/";
const outboundSinkPattern = /\b(?:fetch|WebSocket|EventSource|sendBeacon)\s*\(|\.open\s*\(/i;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && allowedExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function lineNumber(text, index) { return text.slice(0, index).split("\n").length; }

function literalRemoteUrls(text) {
  return [...text.matchAll(remoteUrlPattern)].map((match) => ({ url: match[0], index: match.index ?? 0 }));
}

function containingLine(text, index) {
  const lineStart = text.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const nextLineBreak = text.indexOf("\n", index);
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak;
  return text.slice(lineStart, lineEnd);
}

function isComparableBaseSentinel(text, match) {
  if (match.url !== comparableBaseSentinel) return false;
  const line = containingLine(text, match.index);
  return /\breturn\b/.test(line) && !outboundSinkPattern.test(line);
}

function isParserOnlyUrlConstructor(text, index) {
  const lineStart = text.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const prefix = text.slice(lineStart, index);
  if (!/\bnew\s+URL\s*\([^)]*$/.test(prefix)) return false;
  return !outboundSinkPattern.test(prefix);
}

function javascriptRemoteUrls(text) {
  return literalRemoteUrls(text).filter((match) =>
    !isParserOnlyUrlConstructor(text, match.index) && !isComparableBaseSentinel(text, match)
  );
}

function htmlRemoteUrls(text) {
  const matches = [];
  for (const match of text.matchAll(htmlRemoteAttributePattern)) {
    const url = match[2];
    const start = match.index ?? 0;
    matches.push({ url, index: start + match[0].indexOf(url) });
  }
  for (const match of text.matchAll(cssRemoteReferencePattern)) {
    const url = match[2] ?? match[4];
    if (!url) continue;
    const start = match.index ?? 0;
    matches.push({ url, index: start + match[0].indexOf(url) });
  }
  return matches;
}

function cssRemoteUrls(text) {
  const matches = [];
  for (const match of text.matchAll(cssRemoteReferencePattern)) {
    const url = match[2] ?? match[4];
    if (!url) continue;
    const start = match.index ?? 0;
    matches.push({ url, index: start + match[0].indexOf(url) });
  }
  return matches;
}

function remoteUrls(text, extension) {
  if (extension === ".html") return htmlRemoteUrls(text);
  if (extension === ".css") return cssRemoteUrls(text);
  if (extension === ".js") return javascriptRemoteUrls(text);
  return literalRemoteUrls(text);
}

const violations = [];
for (const path of await walk(sourceRoot)) {
  const text = await readFile(path, "utf8");
  const displayPath = relative(root, path).replaceAll("\\", "/");
  const extension = extname(path);
  for (const { label, pattern } of forbiddenPatterns) {
    const match = pattern.exec(text);
    if (match) violations.push(`${displayPath}:${lineNumber(text, match.index)}: ${label}`);
  }
  for (const match of remoteUrls(text, extension)) {
    let url;
    try { url = new URL(match.url); }
    catch { violations.push(`${displayPath}:${lineNumber(text, match.index)}: malformed remote URL`); continue; }
    if (!allowedRemoteHosts.has(url.hostname)) violations.push(`${displayPath}:${lineNumber(text, match.index)}: undeclared outbound host ${url.hostname}`);
  }
}

if (violations.length) {
  console.error("Privacy audit failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Privacy audit passed: no tracking APIs, browsing/element-history state, or undeclared outbound hosts detected.");
}
