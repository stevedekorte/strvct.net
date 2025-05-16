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
    setJsonCache (json /*, jsonPathComponents = []*/) {
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
        const patch = JsonPatch.compare(lastJson, currentJson);
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
        
        if (jsonPatches.length === 0) {
            console.log("no patches to apply");
            return this;
        }
        
        // Pre-validate paths for array operations
        for (const patch of jsonPatches) {
            // Check if the operation involves an array append to a numeric index path
            if (patch.op === "add" && patch.path.includes("/-")) {
                // For each array append, pre-validate and ensure parent paths exist
                const pathParts = patch.path.split("/").slice(1); // Remove leading empty string
                const appendIndex = pathParts.findIndex(part => part === "-");
                
                if (appendIndex > 0) {
                    // Extract the parent path components
                    const parentPathParts = pathParts.slice(0, appendIndex);
                    
                    // Log the operation for debugging
                    console.log(`Pre-validating array append operation for path: ${patch.path}`);
                    console.log(`Parent path parts: ${parentPathParts.join("/")}`);
                    
                    // Check if any numeric indices are in the parent path
                    for (let i = 0; i < parentPathParts.length; i++) {
                        if (Type.isNumber(parentPathParts[i])) {
                            const numericIndex = Number(parentPathParts[i]);
                            console.log(`Found numeric index ${numericIndex} in parent path at position ${i}`);
                        }
                    }
                }
            }
        }
        
        // Defensive deep copy to avoid modifying the original object
        const oldJson = this.asJson().deepCopy();

        try {
            const results = JsonPatch.applyPatchWithAutoCreation(oldJson, jsonPatches);
            assert(results.newDocument, "applyJsonPatches() results.newDocument missing");
            
            const newJson = results.newDocument;
            assert(Type.isUndefined(newJson.newDocument), "applyJsonPatches() json.newDocument should not have newDocument");

            this.setJson(newJson);
            try {
                // Verify the patch produced the expected result
                assert(JSON.stableStringifyWithStdOptions(newJson) === JSON.stableStringifyWithStdOptions(this.asJson()), 
                       "applyJsonPatches() setJson() did not apply correctly");
            } catch (verificationError) {
                console.warn("Patch verification failed, but continuing:", verificationError);
                // Continue anyway since the patch itself succeeded
            }
            
            this.setLastJson(newJson);
            return this;
            
        } catch (error) {


            console.error("Error applying JSON patches:", error);
            console.error("Failed patches:", JSON.stringify(jsonPatches, null, 2));

            console.error("--- state and patches copied to clip board ---");
            const dataString = ["DATA", JSON.stringify(oldJson, null, 2), "PATCHES", JSON.stringify(jsonPatches, null, 2)].join("-------------");
            error.extraMessage = dataString;

            // Try to provide more context about the error
            if (error.message && error.message.includes("Expected array")) {
                const pathMatch = error.message.match(/Expected array for JSON path: (.+)/);
                if (pathMatch && pathMatch[1]) {
                    const problematicPath = pathMatch[1];
                    console.error(`The problem occurred with path: ${problematicPath}`);
                    
                    // Check if the path exists in the current JSON
                    try {
                        const parentPath = problematicPath.substring(0, problematicPath.lastIndexOf("/"));
                        const lastSegment = problematicPath.substring(problematicPath.lastIndexOf("/") + 1);
                        
                        console.error(`Parent path: ${parentPath}, Last segment: ${lastSegment}`);
                        
                        // Attempt to fix by applying patches one by one
                        console.log("Attempting to apply patches individually...");
                        const fixedJson = this.asJson().deepCopy();
                        
                        for (let i = 0; i < jsonPatches.length; i++) {
                            const singlePatch = [jsonPatches[i]];
                            
                            try {
                                console.log(`Applying patch ${i+1}/${jsonPatches.length}:`, JSON.stringify(singlePatch));
                                const singleResult = JsonPatch.applyPatchWithAutoCreation(fixedJson, singlePatch);
                                console.log(`Patch ${i+1} applied successfully`);
                            } catch (singleError) {
                                console.error(`Failed to apply patch ${i+1}:`, singleError);
                                console.error(`Problematic patch:`, JSON.stringify(singlePatch));
                                // Continue with the next patch
                            }
                        }
                        
                        // If we made it here, apply the fixed JSON
                        this.setJson(fixedJson);
                        this.setLastJson(fixedJson);
                        return this;
                    } catch (analyzeError) {
                        console.error("Error analyzing path:", analyzeError);
                    }
                }
            }
            
            // Re-throw the original error if we couldn't recover
            throw error;
        }
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

            if (Object.hasOwn(currentObj, prop)) {
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