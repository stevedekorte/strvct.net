"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvTranslatableNode
 * @extends TitledNode
 * @classdesc Adds i18n translation support to the node hierarchy.
 * Provides translatedValueOfSlotNamed() for the presentation layer to
 * request translated display values. On cache miss, queues an async
 * translation and calls didUpdateNode() when it arrives.
 *
 * Inheritance chain:
 * SvNode -> TitledNode -> SvTranslatableNode -> InspectableNode -> ViewableNode -> ...
 */

(class SvTranslatableNode extends TitledNode {

    /**
     * @description Returns a translated display value for the named slot.
     * When translation is off, this is a passthrough that returns the raw slot value.
     * When translation is on, returns the cached translation or the English fallback
     * while requesting an async translation that will trigger didUpdateNode() on arrival.
     *
     * @param {String} slotName - The name of the slot.
     * @returns {*} The translated string, or the raw slot value if translation is not needed.
     * @category i18n
     */
    translatedValueOfSlotNamed (slotName) {
        const slot = this.thisPrototype().slotNamed(slotName);
        if (slot && !slot.shouldTranslate()) {
            return this[slotName].call(this);
        }
        const value = this[slotName].call(this);
        const context = this.translationContextForSlotNamed(slotName);
        return this.translatedValueWithContext(value, context);
    }

    /**
     * @description Returns a translated placeholder value for the named slot.
     * Uses the slot's valuePlaceholder annotation and appends placeholder context.
     *
     * @param {String} slotName - The name of the slot.
     * @returns {String|null} The translated placeholder, or the raw placeholder if translation is not needed.
     * @category i18n
     */
    translatedValuePlaceholderOfSlotNamed (slotName) {
        const slot = this.thisPrototype().slotNamed(slotName);
        const value = slot ? slot.valuePlaceholder() : null;
        if (!value) {
            return value;
        }
        const slotContext = this.translationContextForSlotNamed(slotName);
        const context = slotContext ? slotContext + " (placeholder text)" : "placeholder text";
        return this.translatedValueWithContext(value, context, { skipWordLimit: true });
    }

    /**
     * @description Core translation method. Checks filters, tries cache,
     * falls back to async translation with didUpdateNode() on arrival.
     *
     * @param {String} value - The string to translate.
     * @param {String} context - The translation context.
     * @param {Object} [options] - Optional settings.
     * @param {Boolean} [options.skipWordLimit] - If true, skip the 20-word limit check.
     * @returns {String} The translated string, or the original value as fallback.
     * @category i18n
     */
    translatedValueWithContext (value, context, options) {
        if (!value || typeof value !== "string" || value.trim().length === 0) {
            return value;
        }

        if (typeof SvI18n === "undefined") {
            return value;
        }

        const i18n = SvI18n.shared();
        if (!i18n.needsTranslation()) {
            return value;
        }

        // Skip translation for long text (likely content, not UI chrome)
        if (!options || !options.skipWordLimit) {
            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 20) {
                return value;
            }
        }

        // Skip values that don't need translation (numbers, currency, codes, etc.)
        if (this.isUntranslatableValue(value)) {
            return value;
        }

        // Try synchronous cache lookup
        const cached = i18n.cachedTranslate(value, context);
        if (cached !== null) {
            return cached;
        }

        // Cache miss — check IndexedDB store, then fall back to AI translation
        const store = i18n.store();
        if (store && store.isOpen()) {
            store.asyncLookup(value, i18n.currentLanguage()).then(stored => {
                if (stored !== null) {
                    // Found in IndexedDB — add to legacy cache for synchronous access
                    i18n.cache().store(value, i18n.currentLanguage(), context, stored);
                    this.didUpdateNode();
                } else {
                    // Not in store — request AI translation
                    return i18n.asyncTranslate(value, context).then(() => {
                        this.didUpdateNode();
                    });
                }
            }).catch(e => {
                console.warn("[i18n] translation failed for '" + value + "':", e);
            });
        } else {
            // Store not available — go straight to AI translation
            i18n.asyncTranslate(value, context).then(() => {
                this.didUpdateNode();
            }).catch(e => {
                console.warn("[i18n] translation failed for '" + value + "':", e);
            });
        }

        // Return English as fallback until translation arrives
        return value;
    }

    /**
     * @description Returns true if the value does not need translation.
     * Delegates to SvTranslationFilter for pattern matching.
     *
     * @param {String} value - The string to test.
     * @returns {Boolean}
     * @category i18n
     */
    isUntranslatableValue (value) {
        return !SvTranslationFilter.shared().shouldTranslate(value);
    }

    /**
     * @description Returns the translation context for the named slot.
     * Checks the slot's translationContext annotation first, then falls back
     * to the node-level translationContext().
     *
     * @param {String} slotName - The name of the slot.
     * @returns {String} The translation context string.
     * @category i18n
     */
    translationContextForSlotNamed (slotName) {
        const slot = this.thisPrototype().slotNamed(slotName);
        if (slot) {
            const slotContext = slot.translationContext();
            if (slotContext) {
                return slotContext;
            }
        }
        return this.translationContext();
    }

    /**
     * @description Returns the default translation context for this node.
     * Subclasses can override to provide domain-specific context
     * (e.g. "dnd-character-sheet", "game-mechanic").
     *
     * @returns {String} The default translation context.
     * @category i18n
     */
    translationContext () {
        return "ui-label";
    }

}).initThisClass();
