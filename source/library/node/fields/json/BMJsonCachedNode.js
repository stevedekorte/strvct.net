"use strict";

/**
 * @module library.node.fields.json
 * @class BMJsonCachedNode
 * @extends BMSummaryNode
 * @classdesc BMJsonCachedNode represents a node that caches JSON data and provides methods for managing and updating the JSON cache.
 */
(class BMJsonCachedNode extends BMSummaryNode {

    /**
     * @description Initializes the prototype slots for the BMJsonCachedNode.
     */
    initPrototypeSlots () {

        {
            /**
             * @member {String} jsonId
             * @description A unique id for this json node. We'll need this in order to merge json changes properly.
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
     * @returns {BMJsonCachedNode} The current instance.
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
     * @returns {BMJsonCachedNode} The current instance.
     * @category Initialization
     */
    createJsonId () {
        assert(this.jsonId() === null);
        this.setJsonId(Object.newUuid());
        return this;
    }

    /**
     * @description Updates the JSON hash.
     * @returns {BMJsonCachedNode} The current instance.
     * @category Data Management
     */
    updateJsonHash () {
        this.setJsonHashCode(JSON.stableStringifyWithStdOptions(this.asJson()).hashCode());
        return this;
    }

    /**
     * @description Sets the JSON cache and updates the hash.
     * @param {Object} json - The JSON object to cache.
     * @returns {BMJsonCachedNode} The current instance.
     * @category Data Management
     */
    setJsonCache (json, jsonPathComponents = []) {
        this._jsonCache = json;
        if (json === null) {
            this.setJsonHashCode(null);
        } else {
            this.setJsonHashCode(JSON.stableStringifyWithStdOptions(json).hashCode());
        }
        return this;
    }

    /**
     * @description Removes JSON caches.
     * @returns {BMJsonCachedNode} The current instance.
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
        const a = JSON.stableStringifyWithStdOptions(json); 
        if (this.jsonHashCode()) {
            return this.jsonHashCode() === a.hashCode();
        }
        const b = JSON.stableStringifyWithStdOptions(this.asJson());
        return a === b;
    }

    /**
     * @description Returns the JSON representation of the node.
     * @returns {Object} The JSON object.
     * @category Data Retrieval
     */
    asJson () {
        if (this.jsonCache() !== null) {
            return this.jsonCache();
        }
        const json = this.calcJson();
        this.setJsonCache(json);
        return json;
    }

    /**
     * @description Computes JSON patches between the last and current JSON.
     * @returns {Array} An array of JSON patch operations.
     * @category Data Comparison
     */
    computeJsonPatches () {
        const lastJson = this.lastJson() ? this.lastJson() : {};
        const currentJson = this.asJson();
        const patch = JsonPatch.compare(obj, updatedObj);
        this.setLastJson(currentJson);
        return patch;
    }

    /**
     * @description Applies JSON patches to the current JSON.
     * @param {Array} jsonPatches - An array of JSON patch operations.
     * @returns {BMJsonCachedNode} The current instance.
     * @category Data Modification
     */
    applyJsonPatches (jsonPatches) {
        assert(Type.isDeepJsonType(jsonPatches));
        const oldJson = this.asJson().deepCopy();

        const results = JsonPatch.applyPatchWithAutoCreation(oldJson, jsonPatches);
        assert(results.newDocument, "Character.applyJsonPatches() results.newDocument missing");
        
        const newJson = results.newDocument;
        assert(Type.isUndefined(newJson.newDocument), "Character.applyJsonPatches() json.newDocument should not have newDocument");

        if (jsonPatches.length === 0) {
            console.log("no patches to apply");
            debugger;
            return this;
        }

        this.setJson(newJson);
        assert(JSON.stableStringifyWithStdOptions(newJson) === JSON.stableStringifyWithStdOptions(this.asJson()), "Character.applyJsonPatches() setJson() did not apply correctly");
        this.setLastJson(newJson);
        return this;
    }

    /**
     * @description Checks if a path exists in a JSON object.
     * @param {Object} obj - The JSON object to check.
     * @param {string} path - The path to check.
     * @returns {boolean} True if the path exists, false otherwise.
     * @category Data Validation
     */
    jsonHasPath (obj, path) {
        const properties = path.split('/').slice(1);
        let currentObj = obj;

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];

            if (currentObj.hasOwnProperty(prop)) {
                currentObj = currentObj[prop];
            } else {
                return false;
            }
        }

        return true;
    }

    /**
     * @description Finds a descendant node (including self) with the given JSON ID.
     * @param {string} jsonId - The JSON ID to search for.
     * @returns {BMJsonNode|null} The descendant node with the matching JSON ID, or null if no such node is found.
     * @category Node Search
     */
    descendantWithJsonId (jsonId) {
        if (this.jsonId() === jsonId) {
          return this;
        }
        return this.subnodes().detect(sn => {
          if (sn.descendantWithJsonId) {
            return sn.descendantWithJsonId(jsonId);
          }
          return false;
        });
    }

}.initThisClass());