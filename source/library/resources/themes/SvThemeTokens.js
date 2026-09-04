/**
 * @module library.resources.themes
 */

"use strict";

/**
 * @class SvThemeTokens
 * @extends SvThemeFolder
 * @classdesc A folder of CSS custom-property values — one SvStringField per
 * token, keyed by the property name ("--sv-text") with the value as the field
 * value. An SvTheme owns three: tokens shared by every appearance, and one
 * per appearance (light, dark) layered on top.
 *
 * A folder of ordinary fields, deliberately: it is browsed and edited with the
 * generated tiles like any other node (no custom view), any token vocabulary
 * fits without a slot per token (the app's --uo-* names as well as --sv-*),
 * and adding a token is adding a field. The theme publishes these as CSS
 * custom properties at the document root (see SvWebUserInterface); they are
 * never read by views one at a time.
 */
(class SvThemeTokens extends SvThemeFolder {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setSubtitle("tokens");
        this.setNodeCanEditTitle(false);
        this.setCanDelete(false);
    }

    init () {
        super.init();
        this.setSubnodeClasses([SvStringField]);
        return this;
    }

    /**
     * @description The field holding the named token, or null.
     * @param {String} name - the CSS custom property name, e.g. "--sv-text"
     * @returns {SvStringField|null}
     * @category Tokens
     */
    fieldNamed (name) {
        return this.subnodes().detect(sn => sn.key() === name) || null;
    }

    /**
     * @description The value of the named token, or null when unset.
     * @param {String} name
     * @returns {String|null}
     * @category Tokens
     */
    valueNamed (name) {
        const field = this.fieldNamed(name);
        return field ? field.value() : null;
    }

    /**
     * @description Sets one token, adding its field if needed.
     * @param {String} name
     * @param {String} value
     * @returns {SvThemeTokens}
     * @category Tokens
     */
    setValueNamed (name, value) {
        let field = this.fieldNamed(name);
        if (!field) {
            field = this.newFieldNamed(name);
        }
        field.setValue(value);
        return this;
    }

    newFieldNamed (name) {
        const field = SvStringField.clone();
        field.setKey(name);
        field.setKeyIsEditable(true);
        field.setValueIsEditable(true);
        this.addSubnode(field);
        return field;
    }

    /**
     * @description All tokens as a plain { name: value } object, in field order.
     * @returns {Object}
     * @category Tokens
     */
    tokenDict () {
        const dict = {};
        this.subnodes().forEach(field => {
            const v = field.value();
            if (field.key() && v !== null && v !== undefined && v !== "") {
                dict[field.key()] = v;
            }
        });
        return dict;
    }

    /**
     * @description Replaces every token with the entries of a plain object.
     * @param {Object} dict - { "--sv-text": "#111", … }
     * @returns {SvThemeTokens}
     * @category Tokens
     */
    setTokenDict (dict) {
        this.removeAllSubnodes();
        Object.keys(dict || {}).forEach(name => this.setValueNamed(name, dict[name]));
        return this;
    }

    /**
     * @description Token folders carry no per-state styles; SvThemeFolder's
     * styleMap would otherwise ask each field for one.
     * @returns {Map}
     * @category Style
     */
    styleMap () {
        return new Map();
    }

}.initThisClass());
