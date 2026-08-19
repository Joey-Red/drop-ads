(() => {
  const composition = globalThis.DropAdsCookieBannerUtilsComposition;
  if (!composition
    || typeof composition.snapshotUtils !== "function"
    || typeof composition.replaceUtils !== "function") return;

  const utils = composition.snapshotUtils();
  if (!utils
    || typeof utils.rejectionScore !== "function"
    || typeof utils.normalizedActionText !== "function") return;

  const MAX_LOCALIZED_REJECTION_PHRASES = 32;
  const MAX_LOCALIZED_PHRASE_CHARS = 96;
  const MAX_NORMALIZED_ACTION_CHARS = 160;
  const CANONICAL_ACTION_TEXT_PATTERN = /^[a-z0-9' -]+$/;
  const originalRejectionScore = utils.rejectionScore;
  const originalNormalizedActionText = utils.normalizedActionText;
  const LOCALIZED_REJECTION_PHRASES = Object.freeze([
    Object.freeze(["odrzuc wszystkie", 100]),
    Object.freeze(["odrzuc wszystko", 100]),
    Object.freeze(["odrzuc wszystkie pliki cookie", 100]),
    Object.freeze(["tylko niezbedne", 86]),
    Object.freeze(["tylko niezbedne pliki cookie", 86]),
    Object.freeze(["avvisa alla", 100]),
    Object.freeze(["avvisa alla kakor", 100]),
    Object.freeze(["endast nodvandiga", 86]),
    Object.freeze(["endast nodvandiga kakor", 86]),
    Object.freeze(["afvis alle", 100]),
    Object.freeze(["afvis alle cookies", 100]),
    Object.freeze(["kun nodvendige", 86]),
    Object.freeze(["kun nodvendige cookies", 86]),
    Object.freeze(["avvis alle", 100]),
    Object.freeze(["avvis alle informasjonskapsler", 100]),
    Object.freeze(["bare nodvendige", 86]),
    Object.freeze(["bare nodvendige informasjonskapsler", 86]),
    Object.freeze(["hylkaa kaikki", 100]),
    Object.freeze(["hylkaa kaikki evasteet", 100]),
    Object.freeze(["vain valttamattomat", 86]),
    Object.freeze(["vain valttamattomat evasteet", 86]),
    Object.freeze(["odmitnout vse", 100]),
    Object.freeze(["odmitnout vsechny", 100]),
    Object.freeze(["pouze nezbytne", 86]),
    Object.freeze(["pouze nezbytne soubory cookie", 86])
  ]);

  function normalizedActionText(value) {
    let text;
    try { text = originalNormalizedActionText(value); } catch { return null; }
    if (typeof text !== "string" || text.length > MAX_NORMALIZED_ACTION_CHARS) return null;
    if (text === "") return "";
    if (text !== text.trim()
      || text !== text.toLowerCase()
      || /\s{2,}/.test(text)
      || !CANONICAL_ACTION_TEXT_PATTERN.test(text)) return null;
    return text;
  }

  function frozenDataDescriptor(object, key, enumerable) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    if (!descriptor
      || !("value" in descriptor)
      || descriptor.get
      || descriptor.set
      || descriptor.enumerable !== enumerable
      || descriptor.writable
      || descriptor.configurable) return null;
    return descriptor;
  }

  function snapshotLocalizedTuple(entry) {
    let prototype;
    let keys;
    try { prototype = Object.getPrototypeOf(entry); keys = Reflect.ownKeys(entry); }
    catch { return null; }
    if (!Array.isArray(entry)
      || prototype !== Array.prototype
      || !Object.isFrozen(entry)
      || keys.length !== 3
      || !keys.includes("0")
      || !keys.includes("1")
      || !keys.includes("length")
      || keys.some((key) => typeof key !== "string" || !["0", "1", "length"].includes(key))) return null;

    const lengthDescriptor = frozenDataDescriptor(entry, "length", false);
    const phraseDescriptor = frozenDataDescriptor(entry, "0", true);
    const scoreDescriptor = frozenDataDescriptor(entry, "1", true);
    if (!lengthDescriptor || lengthDescriptor.value !== 2 || !phraseDescriptor || !scoreDescriptor) return null;

    const phrase = phraseDescriptor.value;
    const score = scoreDescriptor.value;
    if (typeof phrase !== "string"
      || !phrase
      || phrase.length > MAX_LOCALIZED_PHRASE_CHARS
      || (score !== 100 && score !== 86)) return null;
    const normalized = normalizedActionText(phrase);
    if (normalized !== phrase) return null;
    return Object.freeze({ phrase, score });
  }

  function buildLocalizedLexicon(entries) {
    let prototype;
    let keys;
    try { prototype = Object.getPrototypeOf(entries); keys = Reflect.ownKeys(entries); }
    catch { return null; }
    if (!Array.isArray(entries) || prototype !== Array.prototype || !Object.isFrozen(entries)) return null;

    const lengthDescriptor = frozenDataDescriptor(entries, "length", false);
    if (!lengthDescriptor
      || !Number.isSafeInteger(lengthDescriptor.value)
      || lengthDescriptor.value <= 0
      || lengthDescriptor.value > MAX_LOCALIZED_REJECTION_PHRASES) return null;
    const length = lengthDescriptor.value;
    if (keys.length !== length + 1
      || keys.some((key) => typeof key !== "string" || (key !== "length" && !/^(?:0|[1-9]\d*)$/.test(key)))) return null;

    const lookup = Object.create(null);
    for (let index = 0; index < length; index += 1) {
      const key = String(index);
      if (!keys.includes(key)) return null;
      const entryDescriptor = frozenDataDescriptor(entries, key, true);
      if (!entryDescriptor) return null;
      const tuple = snapshotLocalizedTuple(entryDescriptor.value);
      if (!tuple || Object.prototype.hasOwnProperty.call(lookup, tuple.phrase)) return null;
      Object.defineProperty(lookup, tuple.phrase, {
        value: tuple.score,
        enumerable: true,
        writable: false,
        configurable: false
      });
    }
    return Object.freeze(lookup);
  }

  function baseRejectionScore(value) {
    let score;
    try { score = originalRejectionScore(value); } catch { return null; }
    if (!Number.isSafeInteger(score) || score < 0 || score > 100) return null;
    return score;
  }

  const LOCALIZED_SCORE_BY_PHRASE = buildLocalizedLexicon(LOCALIZED_REJECTION_PHRASES);

  function rejectionScore(value) {
    const baseScore = baseRejectionScore(value);
    if (baseScore === null) return 0;
    if (baseScore > 0) return baseScore;
    if (!LOCALIZED_SCORE_BY_PHRASE) return 0;

    const text = normalizedActionText(value);
    if (!text) return 0;
    return Object.prototype.hasOwnProperty.call(LOCALIZED_SCORE_BY_PHRASE, text)
      ? LOCALIZED_SCORE_BY_PHRASE[text]
      : 0;
  }

  composition.replaceUtils({ rejectionScore });
})();
