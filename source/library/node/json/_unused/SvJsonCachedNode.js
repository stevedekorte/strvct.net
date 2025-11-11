"use strict";

/**
 * @module library.node.fields.json
 * @class SvJsonCachedNode
 * @extends SvSummaryNode
 * @classdesc SvJsonCachedNode represents a node that caches JSON data and provides methods for managing and updating the JSON cache.
 */
(class SvJsonCachedNode extends SvSummaryNode {

    /**
     * @description Initializes the prototype slots for the SvJsonCachedNode.
     */
    initPrototypeSlots () {

        {
            /**
             * @member {String} jsonId
             * @description A unique id for this json node. We'll need this in order to merge json changes properly (e.g. items in arrays).
             * @category Identification
             */
            const slot = this.newSlot("jsonId", null);
            slot.setIsInJsonSchema(true);
            slot.setDescription("A unique id for this json node");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSyncsToView(true);
            slot.setShouldJsonArchive(true);
        }

        {
            /**
             * @member {Object} jsonCache
             * @description The json that this node represents. We update this when the node is edited. The node is the truth and the json is derived from it.
             * @category Data
             */
            const slot = this.newSlot("jsonCache", null);
            slot.setSlotType("JSON Object");
        }

        {
            /**
             * @member {String} jsonHashCode
             * @description A hash of JSON.stableStrigify(jsonCache).
             * @category Data
             */
            const slot = this.newSlot("jsonHashCode", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }

    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {

    }

    /**
     * @description Performs final initialization steps.
     */
    finalInit () {
        super.finalInit();
        this.createJsonIdIfAbsent();
    }

    /**
     * @description Creates a JSON ID if it's absent.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Initialization
     */
    createJsonIdIfAbsent () {
        if (this.jsonId() === null) {
            this.createJsonId();
        }
        return this;
    }

    /**
     * @description Creates a new JSON ID.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Initialization
     */
    createJsonId () {
        assert(this.jsonId() === null);
        this.setJsonId(Object.newUuid());
        return this;
    }

    /*
    setJson (dict, jsonPathComponents = []) {
        //if (this.doesMatchJson(dict)) {
        //   return this;
        //}

        if (this.shouldStoreSubnodes()) {
            this.setSubnodesJson(dict, jsonPathComponents);
        } else {
            this.setSlotsJson(dict, jsonPathComponents);
        }
        //this.setJsonCache(dict, jsonPathComponents); // didUpdateNode will also update jsonCache
        return this;
    }
    */

    /**
     * @description Updates the JSON hash.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Data Management
     */
    updateJsonHash () {
        this.setJsonHashCode(JSON.stableStringifyWithStdOptions(this.asJson(), null, 2).hashCode());
        return this;
    }

    /**
     * @description Sets the JSON cache and updates the hash.
     * @param {Object} json - The JSON object to cache.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Data Management
     */
    setJsonCache (json /*, jsonPathComponents = []*/) {
        this._jsonCache = json;
        if (json === null) {
            this.setJsonHashCode(null);
        } else {
            this.setJsonHashCode(JSON.stableStringifyWithStdOptions(json, null, 2).hashCode());
        }
        return this;
    }

    /**
     * @description Removes JSON caches.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Data Management
     */
    removeJsonCaches () {
        this.setJsonHashCode(null);
        this.setJsonCache(null);
        return this;
    }

    /**
     * @description Called when the node is updated.
     * @category Lifecycle
     */
    didUpdateNode () {
        super.didUpdateNode();
        this.removeJsonCaches();
    }

    /**
     * @description Checks if the given JSON matches the cached JSON.
     * @param {Object} json - The JSON object to compare.
     * @returns {boolean} True if the JSON matches, false otherwise.
     * @category Data Comparison
     */
    doesMatchJson (json) {
        const a = JSON.stableStringifyWithStdOptions(json, null, 2);
        if (this.jsonHashCode()) {
            return this.jsonHashCode() === a.hashCode();
        }
        const b = JSON.stableStringifyWithStdOptions(this.asJson(), null, 2);
        return a === b;
    }

    /**
     * @description Returns the JSON representation of the node.
     * @returns {Object} The JSON object.
     * @category Data Retrieval
     */
    asJson () {
        return this.calcJson();
        /*
        if (this.jsonCache() !== null) {
            /// sanity check to make sure the jsonCache is valid
            const json = this.calcJson();
            const diff = JsonPatch.compare(this.jsonCache(), json);
            if (diff.length > 0) {
                console.error("jsonCache is invalid:\n" + JSON.stringify(diff, null, 2));
                debugger;
            }

            return this.jsonCache();
        }
        const json = this.calcJson();
        this.setJsonCache(json);
        return json;
        */
    }

    calcJson () {
        throw new Error("subclass must implement calcJson()");
    }

    /**
     * @description Computes JSON patches between the last and current JSON.
     * @returns {Array} An array of JSON patch operations.
     * @category Data Comparison
     */
    computeJsonPatches () {
        const lastJson = this.lastJson() ? this.lastJson() : {};
        const currentJson = this.asJson();
        const patch = JsonPatch.compare(lastJson, currentJson);
        this.setLastJson(currentJson);
        return patch;
    }

    /**
     * @description Applies JSON patches to the current JSON.
     * @param {Array} jsonPatches - An array of JSON patch operations.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Data Modification
     */
    applyJsonPatches (/*jsonPatches*/) {
        throw new Error("applyJsonPatches() is no longer implemented. use applyJsonPatches() on the parent JsonGroup instead.");
    }


}.initThisClass());
