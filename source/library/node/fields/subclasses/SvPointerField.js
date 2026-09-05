"use strict";

/** * @module library.node.fields.subclasses
 */

/** * @class SvPointerField
 * @extends SvField
 * @classdesc A field that's a pointer to another node.
 * (sometimes the other node is used as a list of items, but not always)


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

        if (!v) {
            return defaultReturnValue;
        }

        const method = v[methodName];
        if (method === undefined) {
            return defaultReturnValue;
        }
        return method.apply(v);
    }

    /**
     * @description Proxy method to call methods on the value object.
     * @param {string} methodName - The name of the method to call on the value object.
     * @param {...*} args - The arguments to pass to the method.
     * @returns {*} The result of calling the method on the value object.
     * @category Utility
     */
    proxySend (methodName, ...args) {
        const v = this.value();
        assert(v, "SvPointerField proxySend: value is null");
        const method = v[methodName];
        assert(method !== undefined, "SvPointerField proxySend: value object " + v.svType() + " missing method '" + methodName + "'");
        return method.apply(v, args);
    }

    /**
     * @description The pointed-to node's title — or, when there is no node,
     * this field's key, so an inspector row for an unset slot still says
     * what it is rather than rendering blank.
     * @returns {string}
     * @category Data Access
     */
    title () {
        return this.value() ? this.proxyGetter("title") : this.key();
    }

    /**
     * @description The pointed-to node's subtitle — or what an unset value
     * means here: "(inherited)" for an inherited-resource slot (null means
     * inherit up nodeResourceParent()), "(none)" otherwise.
     * @returns {string}
     * @category Data Access
     */
    subtitle () {
        return this.value() ? this.proxyGetter("subtitle") : this.nullValueSubtitle();
    }

    nullValueSubtitle () {
        const slot = this.ownerSlot();
        const inherits = slot && slot.isInheritedResource && slot.isInheritedResource();
        return inherits ? "(inherited)" : "(none)";
    }

    /**
     * @description The slot on the owner this field reads, when the inspector
     * built it from one; null for a free-standing pointer field.
     * @returns {Slot|null}
     * @category Data Access
     */
    ownerSlot () {
        const owner = this.ownerNode();
        const name = this.valueMethod();
        return (owner && name && owner.thisPrototype) ? owner.thisPrototype().slotNamed(name) : null;
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

    serializeToJson (filterName, pathComponents = []) {
        return this.proxySend("serializeToJson", filterName, pathComponents);
    }

    deserializeFromJson (json, filterName, pathComponents = []) {
        return this.proxySend("deserializeFromJson", json, filterName, pathComponents);
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
