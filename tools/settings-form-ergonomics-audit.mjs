import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const formState = read("src/options/form-state-semantics.js");
const uiSemantics = read("src/options/ui-semantics.js");
const legacyHelper = new URL("../src/options/form-ergonomics.js", import.meta.url);

if (fs.existsSync(legacyHelper)) throw new Error("duplicate form-ergonomics helper must not be shipped");
requireText(uiSemantics, 'import "./form-state-semantics.js";', "canonical form-state module load");

for (const [needle, label] of [
  ['const nativeErrorBindings = [', "native form error bindings"],
  ['["#block-error", ["#block-input"]]', "block validity binding"],
  ['["#allow-error", ["#allow-input"]]', "allow validity binding"],
  ['["#subscription-error", ["#subscription-url"]]', "subscription URL validity binding"],
  ['["#cookie-exception-error", ["#cookie-exception-input"]]', "cookie validity binding"],
  ['["#cosmetic-hide-error", ["#cosmetic-hide-selector"]]', "cosmetic hide validity binding"],
  ['["#cosmetic-allow-error", ["#cosmetic-allow-selector"]]', "cosmetic allow validity binding"],
  ['function isNativelyInvalid(control)', "native validity boundary"],
  ['control?.willValidate === true && control?.validity?.valid === false', "native validity decision"],
  ['function publishNativeErrorState(control, errorNode)', "native error state publication"],
  ['function ownNativeErrorState(errorSelector, controlSelectors)', "native error-state ownership"],
  ['control.setAttribute("aria-invalid", "true")', "aria-invalid publication"],
  ['control.setAttribute("aria-errormessage", errorNode.id)', "aria-errormessage publication"],
  ['["#block-error", [["#block-input", "input"]]]', "personal block stale-error clearing"],
  ['["#allow-error", [["#allow-input", "input"]]]', "personal allow stale-error clearing"],
  ['["#cookie-exception-error", [["#cookie-exception-input", "input"]]]', "cookie exception stale-error clearing"],
  ['["#subscription-error", [["#subscription-url", "input"], ["#subscription-format", "change"]]]', "subscription stale-error clearing"],
  ['["#backup-error", [["#import-settings-file", "change"]]]', "backup stale-error clearing"],
  ['function ownCountrySourceState()', "country source readiness"],
  ['submit.disabled = !hasSource()', "country submit gate"],
  ['form?.getAttribute("aria-busy") === "true"', "country busy preservation"],
  ['if (preset.value) custom.value = ""', "preset clears custom country value"],
  ['if (custom.value.trim()) preset.value = ""', "custom country value clears preset"],
  ['function installCosmeticScopePreview(', "cosmetic scope preview"],
  ['"Scope: one site. The site value will be validated when the rule is added."', "one-site cosmetic scope preview"],
  ['"Scope: all sites."', "all-sites cosmetic scope preview"],
  ['appendDescription(document.querySelector(selector), statusId)', "cosmetic scope description association"],
  ['observer.disconnect()', "observer teardown"],
  ['control.removeEventListener(eventName, listener)', "listener teardown"]
]) requireText(formState, needle, label);

const directScopeEcho = /status\.textContent\s*=\s*domainInput\.value(?:\.trim\(\))?\s*;/;
const interpolatedScopeEcho = /status\.textContent\s*=\s*`[^`]*\$\{[^}]*domainInput\.value/s;
if (directScopeEcho.test(formState) || interpolatedScopeEcho.test(formState)) {
  throw new Error("cosmetic scope preview must not echo typed site text");
}
if (/semanticErrorBindings|ownSemanticErrorState|\["#backup-error",\s*\["#import-settings-file"\]\]/.test(formState)) {
  throw new Error("operational errors must not create a separate semantic aria-invalid channel");
}
const nativeBlock = formState.slice(formState.indexOf("const nativeErrorBindings = ["), formState.indexOf("const clearOnEditBindings = ["));
if (/#subscription-format|#backup-error|#cosmetic-hide-domain|#cosmetic-allow-domain/.test(nativeBlock)) {
  throw new Error("native validity bindings must contain only constrained form controls");
}

// Current form ergonomics are verified from the live implementation above.
// Historical milestone test-file presence is intentionally not part of this gate.

console.log("settings-form-ergonomics-audit: canonical Settings form-state invariants verified through M807");
