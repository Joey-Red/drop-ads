import { MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH } from "./options-boundary.js";

function captureOptionsStorageCollaboratorValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(current, key);
    } catch {
      throw new TypeError(`${label} is not safely inspectable`);
    }
    if (descriptor) {
      if (!("value" in descriptor)) throw new TypeError(`${label} must be a data property`);
      return descriptor.value;
    }
    try {
      current = Object.getPrototypeOf(current);
    } catch {
      throw new TypeError(`${label} prototype is not safely inspectable`);
    }
  }
  throw new TypeError(`${label} is unavailable`);
}

export function installOwnedOptionsStorageListener(api, listener) {
  if (typeof listener !== "function") throw new TypeError("Settings storage listener must be a function");
  const storage = captureOptionsStorageCollaboratorValue(api, "storage", "Settings storage namespace");
  const onChanged = captureOptionsStorageCollaboratorValue(storage, "onChanged", "Settings storage.onChanged event");
  const addListener = captureOptionsStorageCollaboratorValue(onChanged, "addListener", "Settings storage.onChanged.addListener");
  const removeListener = captureOptionsStorageCollaboratorValue(onChanged, "removeListener", "Settings storage.onChanged.removeListener");
  if (typeof addListener !== "function") throw new TypeError("Settings storage.onChanged.addListener must be a data function");
  if (typeof removeListener !== "function") throw new TypeError("Settings storage.onChanged.removeListener must be a data function");

  Reflect.apply(addListener, onChanged, [listener]);
  let active = true;
  return () => {
    if (!active) return false;
    active = false;
    try {
      Reflect.apply(removeListener, onChanged, [listener]);
      return true;
    } catch {
      return false;
    }
  };
}
