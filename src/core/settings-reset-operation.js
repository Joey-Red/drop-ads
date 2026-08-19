import { createSettingsBackup, MAX_SETTINGS_BACKUP_BYTES } from "./settings-backup.js";
import { createConfiguredResetState } from "./settings-reset.js";

const MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function captureImportSettingsBackup(core) {
  if (!core || (typeof core !== "object" && typeof core !== "function")) {
    throw new TypeError("Configured settings reset requires the core import transaction");
  }
  let current = core;
  for (let depth = 0; depth <= MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH && current; depth += 1) {
    let descriptor;
    let prototype;
    try {
      descriptor = Object.getOwnPropertyDescriptor(current, "importSettingsBackup");
      prototype = Object.getPrototypeOf(current);
    } catch {
      throw new TypeError("Configured settings reset core is not safely inspectable");
    }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        throw new TypeError("Configured settings reset requires a data-function import transaction");
      }
      return (...args) => Reflect.apply(descriptor.value, core, args);
    }
    current = prototype;
  }
  throw new TypeError("Configured settings reset requires the core import transaction");
}

function serializeConfiguredResetBackup(backup) {
  const text = JSON.stringify(backup);
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > MAX_SETTINGS_BACKUP_BYTES) {
    throw new RangeError("Configured settings reset exceeds the supported backup size");
  }
  return text;
}

export async function resetConfiguredSettings(core) {
  const importSettingsBackup = captureImportSettingsBackup(core);
  const backup = createSettingsBackup(createConfiguredResetState());
  const backupText = serializeConfiguredResetBackup(backup);
  await importSettingsBackup(backupText);
  return Object.freeze({ changed: true });
}
