import { randomBytes } from "node:crypto";
import { lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export function qualificationRecordOutputPath(rootDirectory, candidate) {
  const root = resolve(rootDirectory);
  if (typeof candidate !== "string" || !candidate || isAbsolute(candidate)) {
    throw new Error("Qualification output path must be a relative repository path");
  }
  const output = resolve(root, candidate);
  const child = relative(root, output);
  if (!child || child.startsWith(`..${sep}`) || child === ".." || isAbsolute(child)) {
    throw new Error("Qualification output path must stay inside the repository");
  }
  return output;
}

async function ensureSafeParent(root, outputPath) {
  const parent = dirname(outputPath);
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const child = relative(root, parent);
  if (!child) return;
  let current = root;
  for (const segment of child.split(sep)) {
    current = resolve(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new TypeError("Qualification output parent must be a real directory inside the repository");
    }
  }
}

export async function writeQualificationRecordAtomic(rootDirectory, relativeOutputPath, serialized) {
  const root = resolve(rootDirectory);
  const outputPath = qualificationRecordOutputPath(root, relativeOutputPath);
  if (typeof serialized !== "string" || !serialized) throw new TypeError("Serialized qualification record is required");
  await ensureSafeParent(root, outputPath);

  const temporaryPath = `${outputPath}.pending-${randomBytes(8).toString("hex")}`;
  try {
    await writeFile(temporaryPath, serialized, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
  return outputPath;
}
