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
