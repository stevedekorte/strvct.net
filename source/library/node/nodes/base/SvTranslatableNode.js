"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvTranslatableNode
 * @extends SvTitledNode
 * @classdesc Adds i18n translation support to the node hierarchy.
 * Provides translatedValueOfSlotNamed() for the presentation layer to
 * request translated display values. On cache miss, queues an async
 * translation and calls didUpdateNode() when it arrives.
 *
 * Each node maintains a lazy translationMap (allocated on first use)
 * that caches translated strings for fast sync re-render. This map is
 * FIFO-capped to prevent unbounded growth and cleared on language change.
 * The map lives on the node (not the view) so translations survive view
 * reallocation during UI navigation.
 *
 * NOTE: If accumulated node translation maps become a memory concern,
 * a GC sweep could be added: walk all views, collect their referenced nodes,
 * and clear translationMaps on all in-memory nodes not in that set.
 *
 * Inheritance chain:
 * SvNode -> SvTitledNode -> SvTranslatableNode -> SvInspectableNode -> SvViewableNode -> ...
 */

(class SvTranslatableNode extends SvTitledNode {

    /**
     * @description Maximum number of entries in the node's translationMap.
     * Uses FIFO eviction when exceeded.
     * @returns {Number}
     * @category i18n
     */
    translationMapMaxSize () {
        return 10;
    }

    /**
     * @description Returns the node's translation map, allocating lazily on first use.
     * Maps English source text → translated text for the current language.
     * Auto-clears if the language has changed since the map was last used.
     * @returns {Map}
     * @category i18n
     */
    translationMap () {
        const currentLang = SvI18n.shared().currentLanguage();
        if (this._translationMap) {
            if (this._translationMapLanguage !== currentLang) {
                this._translationMap.clear();
                this._translationMapLanguage = currentLang;
            }
        } else {
            this._translationMap = new Map();
            this._translationMapLanguage = currentLang;
        }
        return this._translationMap;
    }

    /**
     * @description Stores a translation in the node's map with FIFO eviction.
     * @param {String} sourceText - English source text.
     * @param {String} translation - Translated text.
     * @category i18n
     */
    storeInTranslationMap (sourceText, translation) {
        const map = this.translationMap();
        // If key already exists, delete first so re-insertion moves it to end (most recent)
        if (map.has(sourceText)) {
            map.delete(sourceText);
        }
        map.set(sourceText, translation);

        // FIFO eviction: remove oldest entry (first in iteration order)
        if (map.size > this.translationMapMaxSize()) {
            const firstKey = map.keys().next().value;
            map.delete(firstKey);
        }
    }

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

        // 1. Check node's own translation map (sync, survives view reallocation)
        if (this._translationMap && this._translationMap.size > 0) {
            const nodeResult = this.translationMap().get(value);
            if (nodeResult !== undefined) {
                return nodeResult;
            }
        }

        // 2. Try synchronous cache/store lookup
        const cached = i18n.cachedTranslate(value, context);
        if (cached !== null) {
            this.storeInTranslationMap(value, cached);
            return cached;
        }

        // 3. Cache miss — async lookup (IndexedDB then AI translation)
        const node = this;
        i18n.asyncTranslate(value, context).then(() => {
            // Translation is now available in the cache — store in node map too
            const result = i18n.cachedTranslate(value, context);
            if (result !== null) {
                node.storeInTranslationMap(value, result);
            }
            node.didUpdateNode();
        }).catch(e => {
            console.warn("[i18n] translation failed for '" + value + "':", e);
        });

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
