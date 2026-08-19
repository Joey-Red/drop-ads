(() => {
  const helpers = globalThis.DropAdsSelectorUtils;
  if (!helpers) return;

  const selectorUniquelyIdentifies = helpers.selectorUniquelyIdentifies;
  const maxSelectorLength = helpers.MAX_SELECTOR_LENGTH;
  if (typeof selectorUniquelyIdentifies !== "function"
    || !Number.isSafeInteger(maxSelectorLength)
    || maxSelectorLength <= 0) return;

  const CHANGED_SELECTION_ERROR = "Picker selection changed; choose the element again";

  function selectorTextIsCanonical(selector) {
    return typeof selector === "string"
      && selector.length > 0
      && selector.length <= maxSelectorLength
      && selector === selector.trim()
      && !/[\u0000-\u001f\u007f]/.test(selector);
  }

  function documentCanQuery(documentRef) {
    try {
      return Boolean(documentRef
        && documentRef.nodeType === 9
        && typeof documentRef.querySelectorAll === "function");
    } catch {
      return false;
    }
  }

  function targetBelongsToDocument(target, documentRef) {
    try {
      return Boolean(target
        && target.nodeType === 1
        && target.isConnected === true
        && target.ownerDocument === documentRef);
    } catch {
      return false;
    }
  }

  function verifyCandidate(selector, target, documentRef = document) {
    if (!selectorTextIsCanonical(selector)) {
      throw new Error(CHANGED_SELECTION_ERROR);
    }
    if (!documentCanQuery(documentRef) || !targetBelongsToDocument(target, documentRef)) {
      throw new Error(CHANGED_SELECTION_ERROR);
    }
    if (!selectorUniquelyIdentifies(selector, target, documentRef)) {
      throw new Error(CHANGED_SELECTION_ERROR);
    }
    return true;
  }

  globalThis.DropAdsPickerSaveGuard = Object.freeze({
    CHANGED_SELECTION_ERROR,
    selectorTextIsCanonical,
    documentCanQuery,
    targetBelongsToDocument,
    verifyCandidate
  });
})();
