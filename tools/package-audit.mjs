import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FORBIDDEN_DEPENDENCY_FIELDS = Object.freeze([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundledDependencies",
  "bundleDependencies",
  "workspaces"
]);
export const FORBIDDEN_LIFECYCLE_SCRIPTS = Object.freeze([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepack",
  "postpack"
]);

function sameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function auditPackageMetadata(pkg, lock) {
  if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) throw new Error("package.json must be an object");
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) throw new Error("package-lock.json must be an object");

  for (const field of FORBIDDEN_DEPENDENCY_FIELDS) {
    if (Object.hasOwn(pkg, field)) throw new Error(`package.json field ${field} is forbidden by the zero-dependency supply-chain boundary`);
  }

  const scripts = pkg.scripts && typeof pkg.scripts === "object" && !Array.isArray(pkg.scripts) ? pkg.scripts : {};
  for (const script of FORBIDDEN_LIFECYCLE_SCRIPTS) {
    if (Object.hasOwn(scripts, script)) throw new Error(`Automatic npm lifecycle script ${script} is forbidden`);
  }

  if (lock.lockfileVersion !== 3) throw new Error("package-lock.json must use lockfileVersion 3");
  if (lock.name !== pkg.name || lock.version !== pkg.version) throw new Error("package.json and package-lock.json package identity differ");

  const packages = lock.packages;
  if (!packages || typeof packages !== "object" || Array.isArray(packages)) throw new Error("package-lock.json packages map is invalid");
  const packageKeys = Object.keys(packages).sort();
  if (packageKeys.length !== 1 || packageKeys[0] !== "") throw new Error("package-lock.json contains non-root package entries");

  const root = packages[""];
  if (!root || typeof root !== "object" || Array.isArray(root)) throw new Error("package-lock.json root package entry is invalid");
  if (root.name !== pkg.name || root.version !== pkg.version) throw new Error("package-lock root identity differs from package.json");
  if (!sameJson(root.engines, pkg.engines)) throw new Error("package-lock root engines differ from package.json");

  return Object.freeze({ name: pkg.name, version: pkg.version, packages: packageKeys.length });
}

export async function auditPackageFiles(rootDirectory) {
  const root = resolve(rootDirectory);
  const [pkg, lock] = await Promise.all([
    readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "package-lock.json"), "utf8").then(JSON.parse)
  ]);
  return auditPackageMetadata(pkg, lock);
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditPackageFiles(root)
    .then((result) => console.log(`Package supply-chain audit passed (${result.name}@${result.version}; dependency-free lockfile).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
