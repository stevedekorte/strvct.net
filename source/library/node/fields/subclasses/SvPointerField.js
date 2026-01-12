"use strict";

/** * @module library.node.fields.subclasses
 */

/** * @class SvPointerField
 * @extends SvField
 * @classdesc A field that's a pointer to another node.
 * (sometimes the other node is used as a list of items, but not always)


 */

/**

 */

(class SvPointerField extends SvField {

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
        this.setKeyIsVisible(true);
        this.setValueIsVisible(true);
        this.setNodeTileIsSelectable(true);
    }

    /*
    setValue (v) {
        console.warn("WARNING: SvPointerField setValue '" + v + "'");
        return this;
    }
    */

    /**
     * @description Proxy getter for methods of the value object.
     * @param {string} methodName - The name of the method to call on the value object.
     * @param {*} defaultReturnValue - The default return value if the value object is null or undefined.
     * @returns {*} The result of calling the method on the value object, or the default return value.
     * @category Utility
     */
    proxyGetter (methodName, defaultReturnValue = "") {
        // using logPrefix() here causes a loop reference because it calls title->proxyGetter->title->...
        //console.log("SvPointerField proxyGetter: calling method '" + methodName);

        const v = this.value();
        //console.log("SvPointerField proxyGetter: on value object " + v.svType());

        if (!v) {
            return defaultReturnValue;
        }
        const method = v[methodName];
        assert(method !== undefined, "SvPointerField proxyGetter: value object " + v.svType() + " missing method '" + methodName + "'");
        return method.apply(v);
    }

    /**
     * @description Gets the title of the value object.
     * @returns {string} The title of the value object.
     * @category Data Access
     */
    title () {
        const title = this.proxyGetter("title");
        return title;
    }

    /**
     * @description Gets the subtitle of the value object.
     * @returns {string} The subtitle of the value object.
     * @category Data Access
     */
    subtitle () {
        return this.proxyGetter("subtitle");
    }

    /**
     * @description Gets the note of the value object.
     * @returns {string} The note of the value object.
     * @category Data Access
     */
    note () {
        return this.proxyGetter("note");
    }

    /**
     * @description Gets the node tile link.
     * @returns {*} The value of the field.
     * @category Data Access
     */
    nodeTileLink () {
        return this.value();
    }

    hasNewLineSeparator () {
        return this.proxyGetter("hasNewLineSeparator");
    }

    /**
     * @description Gets the JSON archive of the value object.
     * @returns {*} The JSON archive of the value object, or undefined if not available.
     * @category Data Access
     */
    jsonArchive () {
        return this.proxyGetter("jsonArchive", undefined);
        /*
        if (this.value() && this.value().jsonArchive) {
            return this.value().jsonArchive();
        }
        return undefined;
        */
    }

    summary () {
        return this.proxyGetter("summary", "(no summary)");
    }

    summaryFormat () {
        return this.proxyGetter("summaryFormat", "key");
    }

    summaryHidePolicy () {
        return this.proxyGetter("summaryHidePolicy", "none");
    }

    summaryHasNewlineAfterSummary () {
        return this.proxyGetter("summaryHasNewlineAfterSummary", true);
    }

    summaryHasNewlineBeforeSummary () {
        return this.proxyGetter("summaryHasNewlineBeforeSummary", false);
    }

    summaryKey () {
        return this.proxyGetter("summaryKey", "(no key)");
    }

    /**
     * @description Returns the value of the field.
     * @returns {Object} The value.
     */
    summaryValue () {
        return this.proxyGetter("summaryValue", "(no value)");
        /*
        const v = this.value();
        if (v && v.summaryValue) { // need this in case we're pointing to a node that doesn't have a summaryValue method
            const summaryValue = v.summaryValue();
            // if summaryValue is a string with multiple lines, add a newline prefix
            if (Type.isString(summaryValue) && summaryValue.includes("\n")) {
                return "\n" + summaryValue;
            }
            return summaryValue;
        }
        */
    }

}.initThisClass());
