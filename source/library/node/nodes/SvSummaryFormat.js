"use strict";

/**
 * @module library.node.nodes
 */

/**
 * @class SvSummaryFormat
 * @extends ProtoClass
 * @classdesc A parsed summary template (see docs/Plans/Summary Format).
 *
 * Templates are freeform strings with {key} and {value} tokens, e.g.
 * "{key}: {value}" or "foo {value} ({key})\n". The two-character escape
 * \n renders as a newline. Rendering rules:
 *
 * - The summary hides (renders "") iff the template's FIRST token resolves
 *   empty — this preserves the legacy behavior where "key value" still
 *   shows the key when the value is empty (field labels rely on it).
 * - Later empty tokens render as empty strings.
 * - Tokens are parsed from the TEMPLATE in a single pass, so substituted
 *   data is never re-scanned (no injection via data containing "{key}").
 * - The literal string "none" (a legacy enum value and Slot's default) is
 *   an empty template.
 *
 * Instances are immutable and cached per template string — use
 * SvSummaryFormat.fromString(s), not clone().
 */
(class SvSummaryFormat extends ProtoClass {

    static initClass () {
        this.newClassSlot("formatCache", new Map()); // template string -> SvSummaryFormat
    }

    /**
     * @static
     * @description Returns the (cached) parsed format for a template string.
     * @param {string} aString - The template string.
     * @returns {SvSummaryFormat} The parsed format.
     * @category Creation
     */
    static fromString (aString) {
        const s = (aString === null || aString === undefined) ? "" : String(aString);
        const cache = this.formatCache();
        let format = cache.get(s);
        if (!format) {
            format = this.clone().parseString(s);
            cache.set(s, format);
        }
        return format;
    }

    initPrototypeSlots () {
        /**
         * @member {String} templateString - the source template
         * @category State
         */
        {
            const slot = this.newSlot("templateString", "");
            slot.setSlotType("String");
        }

        /**
         * @member {Array} parts - alternating literal strings and token
         * marker objects ({token: "key"|"value"}) parsed from the template
         * @category State
         */
        {
            const slot = this.newSlot("parts", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Parses a template string into parts. Called once per
     * cached instance by fromString.
     * @param {string} s - The template string.
     * @returns {SvSummaryFormat} The current instance.
     * @category Parsing
     */
    parseString (s) {
        this.setTemplateString(s);
        const parts = [];
        if (s !== "" && s !== "none") { // "none" is the legacy/Slot default for "no summary"
            s.split(/(\{key\}|\{value\})/).forEach((piece) => {
                if (piece === "{key}") {
                    parts.push({ token: "key" });
                } else if (piece === "{value}") {
                    parts.push({ token: "value" });
                } else if (piece.length) {
                    parts.push(piece.replaceAll("\\n", "\n"));
                }
            });
        }
        this.setParts(parts);
        return this;
    }

    /**
     * @description True when the template renders nothing.
     * @returns {Boolean}
     * @category Rendering
     */
    isEmpty () {
        return this.parts().length === 0;
    }

    /**
     * @description The first token name referenced by the template, or null.
     * @returns {String|null}
     * @category Rendering
     */
    firstTokenName () {
        const part = this.parts().find(p => typeof p !== "string");
        return part ? part.token : null;
    }

    /**
     * @description Renders the template with the given key and value.
     * @param {string} key - The key text ("" when absent).
     * @param {string} value - The value text ("" when absent).
     * @returns {string} The rendered summary, or "" when hidden.
     * @category Rendering
     */
    apply (key, value) {
        // The required-first-token check is FALSY-based (matching the legacy
        // branches' `if (!k) return ""`), but rendering must stringify
        // faithfully: 0 and false are real values and render as "0"/"false"
        // — coercing with `v || ""` silently blanked every zero (coin
        // amounts, counters) in summaries.
        const raw = { key: key, value: value };
        const first = this.firstTokenName();
        if (first && !raw[first]) {
            return ""; // first-token-required rule (see classdesc)
        }
        const values = {
            key: Type.isNullOrUndefined(key) ? "" : String(key),
            value: Type.isNullOrUndefined(value) ? "" : String(value)
        };
        return this.parts().map(p => (typeof p === "string") ? p : values[p.token]).join("");
    }

}.initThisClass());
