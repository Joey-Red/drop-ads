import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const MIN_NODE_VERSION = Object.freeze([22, 0, 0]);
export const MIN_NPM_VERSION = Object.freeze([10, 0, 0]);

export function parseVersion(value, label = "version") {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(value ?? "").trim());
  if (!match) throw new Error(`${label} is not a supported semantic version: ${String(value ?? "")}`);
  return match.slice(1, 4).map(Number);
}

export function versionAtLeast(actual, minimum) {
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

export function npmVersionFromUserAgent(userAgent) {
  const match = /(?:^|\s)npm\/([^\s]+)/.exec(String(userAgent ?? ""));
  if (!match) throw new Error("npm version is unavailable; run the environment audit through npm");
  return match[1];
}

function format(version) {
  return version.join(".");
}

export function auditEnvironment({
  nodeVersion = process.versions.node,
  npmUserAgent = process.env.npm_config_user_agent
} = {}) {
  const node = parseVersion(nodeVersion, "Node version");
  if (!versionAtLeast(node, MIN_NODE_VERSION)) {
    throw new Error(`Unsupported Node ${format(node)}; Drop Ads requires Node >=${format(MIN_NODE_VERSION)}`);
  }

  const npm = parseVersion(npmVersionFromUserAgent(npmUserAgent), "npm version");
  if (!versionAtLeast(npm, MIN_NPM_VERSION)) {
    throw new Error(`Unsupported npm ${format(npm)}; Drop Ads requires npm >=${format(MIN_NPM_VERSION)}`);
  }

  return Object.freeze({ node: format(node), npm: format(npm) });
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    const result = auditEnvironment();
    console.log(`Qualification environment passed (Node ${result.node}, npm ${result.npm}).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
