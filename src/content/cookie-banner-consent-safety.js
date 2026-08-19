(() => {
  const CONSENT_SAFETY_GLOBAL = "DropAdsCookieBannerConsentSafety";
  const STRONG_COOKIE_CONSENT_PATTERN = /(?:\b(?:cookie|cookies|cookie policy|privacy choices?|tracking technologies|tracking technologien|tracking-technologien|datenschutzeinstellungen|privacykeuzes|trackingtechnologieën|pliki cookie|kakor|integritetsval|privatlivsvalg|informasjonskapsler|personvernvalg|evästeet|tietosuojavalinnat|soubory cookie)\b|choix de confidentialité|technologies de suivi|opciones de privacidad|tecnologías de seguimiento|scelte sulla privacy|tecnologie di tracciamento|opções de privacidade|tecnologias de rastreamento|ustawienia prywatności|volby soukromí)/i;

  function ownDataValue(object, key) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    return descriptor && "value" in descriptor && !descriptor.get && !descriptor.set ? descriptor.value : null;
  }

  const composition = ownDataValue(globalThis, "DropAdsCookieBannerUtilsComposition");
  const snapshotUtils = ownDataValue(composition, "snapshotUtils");
  if (!composition || !Object.isFrozen(composition) || typeof snapshotUtils !== "function") return;

  let utils;
  try { utils = Reflect.apply(snapshotUtils, composition, []); }
  catch { return; }
  const boundedConsentContext = ownDataValue(utils, "boundedConsentContext");
  if (typeof boundedConsentContext !== "function") return;

  function isStrongConsentContainer(element) {
    if (!element || typeof element !== "object") return false;
    let context;
    try { context = Reflect.apply(boundedConsentContext, undefined, [element]); }
    catch { return false; }
    return typeof context === "string" && context.length > 0 && STRONG_COOKIE_CONSENT_PATTERN.test(context);
  }

  const api = Object.freeze({ isStrongConsentContainer });
  let existing;
  try { existing = Object.getOwnPropertyDescriptor(globalThis, CONSENT_SAFETY_GLOBAL); }
  catch { return; }
  if (existing) return;
  try {
    Object.defineProperty(globalThis, CONSENT_SAFETY_GLOBAL, {
      value: api,
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch {
    // Fail closed: executor will not initialize without an exact consent-safety collaborator.
  }
})();
