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
        const value = this[slotName].call(this);

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
        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount > 20) {
            return value;
        }

        // Skip values that don't need translation (numbers, currency, codes)
        if (this.isUntranslatableValue(value)) {
            return value;
        }

        const context = this.translationContextForSlotNamed(slotName);

        // Try synchronous cache lookup
        const cached = i18n.cachedTranslate(value, context);
        if (cached !== null) {
            console.log("[i18n] cache hit: '" + value + "' → '" + cached + "' (" + this.svType() + "." + slotName + ")");
            return cached;
        }

        // Cache miss — request async translation, update node when ready
        console.log("[i18n] cache miss: '" + value + "' — requesting async translation (" + this.svType() + "." + slotName + ", context: " + context + ")");
        i18n.asyncTranslate(value, context).then(() => {
            console.log("[i18n] translation arrived for '" + value + "' — triggering didUpdateNode on " + this.svType());
            this.didUpdateNode();
        }).catch(e => {
            console.warn("[i18n] translation FAILED for '" + value + "':", e);
        });

        // Return English as fallback until translation arrives
        return value;
    }

    /**
     * @description Returns true if the value does not need translation.
     * Matches numbers, currency amounts, alphanumeric codes, and other
     * non-linguistic strings that would come back unchanged from translation.
     *
     * Examples that pass through: "42", "-3.14", "1,000", "$9.99", "23A",
     * "#7", "100%", "10/20", "3d6", "+5", "2:30", "1st", "HP: 45"
     *
     * @param {String} value - The string to test.
     * @returns {Boolean}
     * @category i18n
     */
    isUntranslatableValue (value) {
        const trimmed = value.trim();

        // Strip leading currency symbols and whitespace for the core check
        // Covers $, EUR, GBP, JPY, etc. and common currency signs
        const stripped = trimmed.replace(/^[\$\u20AC\u00A3\u00A5\u20B9\u20A9\u20BD\u20BF\s]+/, "");

        // If what remains is purely numeric (with optional separators, decimals, signs, percent)
        // then it's a number or currency amount
        if (/^[+-]?[\d][\d,.']*[%]?$/.test(stripped)) {
            return true;
        }

        // Alphanumeric codes: short strings with no translatable word runs
        // A "word run" is 3+ consecutive letters (e.g. "Hit" is translatable, "A2" is not)
        // This catches: "23A", "#7", "B2", "3d6", "+5", "10/20", "2:30"
        if (trimmed.length <= 10 && !/[a-zA-Z]{3,}/.test(trimmed)) {
            return true;
        }

        // Ordinals like "1st", "2nd", "3rd", "4th" — these are borderline but
        // typically don't translate well in isolation
        if (/^\d+(?:st|nd|rd|th)$/i.test(trimmed)) {
            return true;
        }

        // Colon-separated label:value where the value is numeric
        // e.g. "HP: 45", "AC: 18" — the label part is short enough to skip
        if (/^[A-Z]{1,4}:\s*[\d,.']+$/.test(trimmed)) {
            return true;
        }

        return false;
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
