import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const MAX_OPTIONAL_BACKGROUND_FEATURES = 32;
export const MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS = 64;

const OPTIONAL_FEATURE_KEYS = new Set(["name", "install"]);
const OPTIONAL_INSTALL_OPTION_KEYS = new Set(["logger", "core", "registrations"]);
const BOOTSTRAP_OPTION_KEYS = new Set(["startCore", "installMandatoryRecovery", "optionalFeatures", "logger"]);
const MAX_TEARDOWN_PROTOTYPE_DEPTH = 8;
const MAP_BRAND_PROBE = Object.freeze({});

function optionField(options, key, label) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new TypeError(`${label}.${key} must be an own enumerable data field when present`);
  return field;
}

function captureCallable(callback, receiver, label) {
  if (typeof callback !== "function") throw new TypeError(`${label} must be callable`);
  return (...args) => Reflect.apply(callback, receiver, args);
}

function isActualMap(value) {
  try {
    Map.prototype.has.call(value, MAP_BRAND_PROBE);
    return true;
  } catch {
    return false;
  }
}

function storeRegistration(registrations, name, registration) {
  Reflect.apply(Map.prototype.set, registrations, [name, registration]);
}

function mapEntriesSnapshot(registrations) {
  return Reflect.apply(Array.from, Array, [Reflect.apply(Map.prototype.entries, registrations, [])]);
}

function clearRegistrations(registrations) {
  Reflect.apply(Map.prototype.clear, registrations, []);
}

function loggerWarn(logger, label) {
  if (logger === console) return captureCallable(console.warn, console, `${label}.warn`);
  const warn = readPlainDataField(logger, "warn");
  if (!warn.safe || !warn.present || typeof warn.value !== "function") {
    throw new TypeError(`${label} must provide warn()`);
  }
  return captureCallable(warn.value, logger, `${label}.warn`);
}

function warnBestEffort(warn, ...args) {
  try { warn(...args); } catch { /* diagnostics must not alter bootstrap or teardown control flow */ }
}

function validateOptionalBackgroundFeatures(features) {
  const candidates = snapshotDenseDataArray(features, "Optional background features", MAX_OPTIONAL_BACKGROUND_FEATURES);
  const names = new Set();
  return candidates.map((feature) => {
    assertPlainExactObject(feature, "Optional background feature", OPTIONAL_FEATURE_KEYS);
    const nameField = readPlainDataField(feature, "name");
    const installField = readPlainDataField(feature, "install");
    if (!nameField.safe || !nameField.present || typeof nameField.value !== "string"
      || !installField.safe || !installField.present || typeof installField.value !== "function") {
      throw new TypeError("Optional background feature descriptor is invalid");
    }
    const rawName = nameField.value;
    if (rawName.length > MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS) {
      throw new Error(`Optional background feature name exceeds ${MAX_OPTIONAL_BACKGROUND_FEATURE_NAME_CHARS} characters`);
    }
    const name = rawName.trim();
    if (!name) throw new TypeError("Optional background feature name is required");
    if (name !== rawName) throw new Error("Optional background feature names must already be trimmed");
    if (names.has(name)) throw new Error(`Duplicate optional background feature: ${name}`);
    names.add(name);
    return { name, install: installField.value };
  });
}

function setFeatureStatus(status, name, value) {
  Object.defineProperty(status, name, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
}

function captureBoundDisposer(registration, label) {
  if (registration == null) return null;
  if (typeof registration !== "object" && typeof registration !== "function") {
    throw new TypeError(`${label} registration must be an object when present`);
  }

  let current = registration;
  for (let depth = 0; current && depth <= MAX_TEARDOWN_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, "dispose"); }
    catch { throw new TypeError(`${label} dispose is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor)) throw new TypeError(`${label} dispose must be a data function`);
      if (descriptor.value == null) return null;
      if (typeof descriptor.value !== "function") throw new TypeError(`${label} dispose must be a data function`);
      return captureCallable(descriptor.value, registration, `${label} dispose`);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (current) throw new TypeError(`${label} dispose exceeds the prototype inspection limit`);
  return null;
}

function captureOptionalDisposer(registration) {
  const dispose = captureBoundDisposer(registration, "Optional background feature");
  return dispose ? Object.freeze({ dispose }) : null;
}

function captureLayerDisposer(registration, label) {
  return captureBoundDisposer(registration, label);
}

function disposeStartupLayerBestEffort(dispose, warn, label) {
  if (!dispose) return;
  try {
    const result = dispose();
    void Promise.resolve(result).catch((error) => {
      warnBestEffort(warn, `drop-ads ${label} failed during failed-startup rollback`, error);
    });
  } catch (error) {
    warnBestEffort(warn, `drop-ads ${label} failed during failed-startup rollback`, error);
  }
}

export function installOptionalBackgroundFeatures(features, options = {}) {
  assertPlainExactObject(options, "Optional background feature install options", OPTIONAL_INSTALL_OPTION_KEYS);
  const loggerField = optionField(options, "logger", "Optional background feature install options");
  const coreField = optionField(options, "core", "Optional background feature install options");
  const registrationsField = optionField(options, "registrations", "Optional background feature install options");
  const logger = loggerField.present ? loggerField.value : console;
  const warn = loggerWarn(logger, "Optional background feature logger");
  const core = coreField.present ? coreField.value : undefined;
  const registrations = registrationsField.present ? registrationsField.value : undefined;
  const hasRegistrations = registrationsField.present;
  if (hasRegistrations && !isActualMap(registrations)) {
    throw new TypeError("Optional background feature registrations must be a Map");
  }

  const validated = validateOptionalBackgroundFeatures(features);
  const status = Object.create(null);

  for (const feature of validated) {
    try {
      const registration = feature.install(core);
      const disposable = captureOptionalDisposer(registration);
      if (hasRegistrations && disposable) storeRegistration(registrations, feature.name, disposable);
      setFeatureStatus(status, feature.name, "installed");
    } catch (error) {
      setFeatureStatus(status, feature.name, "failed");
      warnBestEffort(warn, `drop-ads optional background feature failed to initialize: ${feature.name}`, error);
    }
  }

  return Object.freeze(status);
}

export function bootstrapBackground(options = {}) {
  assertPlainExactObject(options, "Background bootstrap options", BOOTSTRAP_OPTION_KEYS);
  const startCoreField = optionField(options, "startCore", "Background bootstrap options");
  const mandatoryField = optionField(options, "installMandatoryRecovery", "Background bootstrap options");
  const optionalField = optionField(options, "optionalFeatures", "Background bootstrap options");
  const loggerField = optionField(options, "logger", "Background bootstrap options");
  const startCore = startCoreField.present ? startCoreField.value : undefined;
  const installMandatoryRecovery = mandatoryField.present ? mandatoryField.value : undefined;
  const optionalFeatures = optionalField.present ? optionalField.value : [];
  const logger = loggerField.present ? loggerField.value : console;
  const warn = loggerWarn(logger, "Background bootstrap logger");

  if (typeof startCore !== "function") throw new TypeError("Background core starter is required");
  if (typeof installMandatoryRecovery !== "function") throw new TypeError("Mandatory recovery installer is required");

  // Validate all optional descriptors before the mandatory startup path begins.
  // This prevents a late malformed descriptor from leaving a partially installed
  // optional registry around an otherwise healthy blocker.
  const validatedOptionalFeatures = validateOptionalBackgroundFeatures(optionalFeatures);

  // Mandatory startup remains fail-loud, but a failure after core startup must
  // not leave an unreturned core registration behind for the next retry.
  const core = startCore();
  const coreDispose = captureLayerDisposer(core, "Background core");
  let mandatoryRecovery;
  let mandatoryDispose;
  try {
    mandatoryRecovery = installMandatoryRecovery(core);
    mandatoryDispose = mandatoryRecovery === core
      ? coreDispose
      : captureLayerDisposer(mandatoryRecovery, "Mandatory recovery");
  } catch (error) {
    disposeStartupLayerBestEffort(coreDispose, warn, "background core");
    throw error;
  }

  const optionalRegistrations = new Map();
  const features = installOptionalBackgroundFeatures(validatedOptionalFeatures, { logger, core, registrations: optionalRegistrations });
  let optionalDisposePromise = null;
  let backgroundDisposePromise = null;

  function disposeOptionalFeatures() {
    if (optionalDisposePromise) return optionalDisposePromise;
    const registrations = mapEntriesSnapshot(optionalRegistrations).reverse();
    clearRegistrations(optionalRegistrations);
    optionalDisposePromise = (async () => {
      for (const [name, registration] of registrations) {
        try {
          await registration.dispose();
        } catch (error) {
          warnBestEffort(warn, `drop-ads optional background feature failed during teardown: ${name}`, error);
        }
      }
    })();
    return optionalDisposePromise;
  }

  async function disposeLayer(dispose, label) {
    if (!dispose) return;
    try {
      await dispose();
    } catch (error) {
      warnBestEffort(warn, `drop-ads ${label} failed during teardown`, error);
    }
  }

  function disposeBackground() {
    if (backgroundDisposePromise) return backgroundDisposePromise;
    backgroundDisposePromise = (async () => {
      await disposeOptionalFeatures();
      await disposeLayer(mandatoryDispose, "mandatory recovery");
      if (core !== mandatoryRecovery) await disposeLayer(coreDispose, "background core");
    })();
    return backgroundDisposePromise;
  }

  return Object.freeze({ core, features, disposeOptionalFeatures, disposeBackground });
}
