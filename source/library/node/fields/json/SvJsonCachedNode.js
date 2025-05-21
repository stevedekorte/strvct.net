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

    /**
     * @description Updates the JSON hash.
     * @returns {SvJsonCachedNode} The current instance.
     * @category Data Management
     */
    updateJsonHash () {
        this.setJsonHashCode(JSON.stableStringifyWithStdOptions(this.asJson()).hashCode());
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
            this.setJsonHashCode(JSON.stableStringifyWithStdOptions(json).hashCode());
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
    applyJsonPatches (jsonPatches) {
        assert(Type.isArray(jsonPatches), "applyJsonPatches() jsonPatches is not an array");
        assert(Type.isDeepJsonType(jsonPatches), "applyJsonPatches() jsonPatches is not a deep json type");
        
        if (jsonPatches.length === 0) {
            console.log("no patches to apply");
            return this;
        }
        
        // Defensive deep copy to avoid modifying the original object
        const oldJson = this.asJson().deepCopy();

        // sanity check to make sure current json is valid 
        this.setJson(oldJson);

        const diff = JsonPatch.compare(this.asJson(), oldJson);
        if (diff.length > 0) {
            console.error("there shouldn't be a diff between the current and old json:\n" + JSON.stringify(diff, null, 2));
            debugger;
        }


        // NOTE: We've disabled the pre-validation and auto-creation code to let the
        // library raise exceptions when using "/-" on non-existent arrays.
        // This aligns with the JSON Patch spec (RFC 6902).
        
        /* 
        // DISABLED: Pre-validation and preparation for array operations
        // First pass: identify and prepare paths for array operations
        const arrayParentPaths = new Set();
        for (const patch of jsonPatches) {
            // Check if the operation involves an array append using "/-" path
            if (patch.op === "add" && patch.path.includes("/-")) {
                const pathParts = patch.path.split("/").slice(1); // Remove leading empty string
                const appendIndex = pathParts.findIndex(part => part === "-");
                
                if (appendIndex > 0) {
                    // Extract the parent path that should contain an array
                    const parentPathParts = pathParts.slice(0, appendIndex);
                    const parentPath = "/" + parentPathParts.join("/");
                    arrayParentPaths.add(parentPath);
                    
                    // Get current value at parent path, if it exists
                    let currentObj = oldJson;
                    let pathExists = true;
                    
                    for (let i = 0; i < parentPathParts.length; i++) {
                        const part = parentPathParts[i];
                        if (currentObj === undefined || currentObj === null) {
                            pathExists = false;
                            break;
                        }
                        
                        // If a numeric index exists in the parent path, ensure objects along the way
                        // Note: isInteger is defined in Type.js
                        if (Type.isInteger(part) && !Array.isArray(currentObj)) {
                            console.warn(`Converting object to array at: ${parentPathParts.slice(0, i).join("/")}`);
                            // This is just for warning/log purposes
                        }
                        
                        currentObj = currentObj[part];
                    }
                    
                    // If the parent path doesn't exist or isn't an array, create prep patches
                    if (!pathExists || !Array.isArray(currentObj)) {
                        console.log(`Ensuring array at path: ${parentPath}`);
                        
                        // Create a patch to ensure the parent path exists as an array
                        const ensureArrayPatch = {
                            op: "test",
                            path: parentPath,
                            value: []
                        };
                        
                        try {
                            // Test if path exists and is an array
                            JsonPatch.applyOperation(oldJson, ensureArrayPatch);
                        } catch (e) {
                            // Path doesn't exist or isn't an array, so create it
                            // Create all parent paths if needed
                            this.ensureParentPathsExist(oldJson, parentPathParts);
                            
                            // Force the target path to be an array
                            let current = oldJson;
                            for (let i = 0; i < parentPathParts.length - 1; i++) {
                                const part = parentPathParts[i];
                                if (current[part] === undefined || current[part] === null) {
                                    // Create intermediate object if needed
                                    current[part] = {};
                                }
                                current = current[part];
                            }
                            
                            // Set the final part to be an array
                            const finalPart = parentPathParts[parentPathParts.length - 1];
                            if (current[finalPart] === undefined || current[finalPart] === null || !Array.isArray(current[finalPart])) {
                                // Force it to be an array
                                current[finalPart] = [];
                            }
                        }
                    }
                }
            }
        }
        */
        
        try {
            // Apply all patches to the JSON object
            const results = JsonPatch.applyPatch(oldJson, jsonPatches);
            assert(results.newDocument, "applyJsonPatches() results.newDocument missing");
            
            const newJson = results.newDocument;
            assert(Type.isUndefined(newJson.newDocument), "applyJsonPatches() json.newDocument should not have newDocument");
            
            // We still keep the post-processing fix to ensure any objects with numeric keys
            // are converted to arrays, as this doesn't interfere with the spec-compliant behavior
            this.fixNumericKeyObjectsToArrays(newJson);

            this.setJson(newJson);
            try {
                // Verify the patch produced the expected result
                const matches = JSON.stableStringifyWithStdOptions(newJson) === JSON.stableStringifyWithStdOptions(this.asJson());
                if (!matches) {
                    // ok, to produce a more useful error message, we'll need to
                    // find the first difference between the newJson and the asJson()
                    // and report that.
                    const diff = JsonPatch.compare(this.asJson(), newJson);
                    const msg = "applyJsonPatches() setJson() might not have applied correctly diff (though if these are computed values, or added propeties, we would expect to see them in this diff):\n" + JSON.stringify(diff, null, 2);
                    console.warn(msg);
                    //debugger;
                    //throw new Error(msg);
                }
            } catch (verificationError) {
                console.warn("Patch verification failed, but continuing:", verificationError);
                // Continue anyway since the patch itself succeeded
            }
            
            this.setLastJson(newJson);
            return this;
            
        } catch (error) {
            console.error("Error applying JSON patches:", error);
            console.error("Failed patches:", JSON.stringify(jsonPatches, null, 2));
            
            // Re-throw the error - we're no longer attempting automatic recovery
            // to align with the JSON Patch specification
            throw error;
            
            /* 
            // DISABLED: Error recovery code
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
                        
                        // For each patch, ensure paths exist with proper types
                        for (let i = 0; i < jsonPatches.length; i++) {
                            const patch = jsonPatches[i];
                            const singlePatch = [patch];
                            
                            try {
                                // If it's an array operation, ensure parent path is an array
                                if (patch.op === "add" && patch.path.includes("/-")) {
                                    const pathParts = patch.path.split("/").slice(1);
                                    const appendIndex = pathParts.findIndex(part => part === "-");
                                    if (appendIndex > 0) {
                                        const parentPathParts = pathParts.slice(0, appendIndex);
                                        this.ensureParentPathsExist(fixedJson, parentPathParts);
                                        
                                        // Force array at parent path
                                        let current = fixedJson;
                                        for (let j = 0; j < parentPathParts.length - 1; j++) {
                                            current = current[parentPathParts[j]];
                                        }
                                        
                                        const finalPart = parentPathParts[parentPathParts.length - 1];
                                        if (!Array.isArray(current[finalPart])) {
                                            current[finalPart] = [];
                                        }
                                    }
                                }
                                
                                console.log(`Applying patch ${i+1}/${jsonPatches.length}:`, JSON.stringify(singlePatch));
                                const singleResult = JsonPatch.applyPatchWithAutoCreation(fixedJson, singlePatch);
                                console.log(`Patch ${i+1} applied successfully`);
                            } catch (singleError) {
                                console.error(`Failed to apply patch ${i+1}:`, singleError);
                                console.error(`Problematic patch:`, JSON.stringify(singlePatch));
                                // Continue with the next patch
                            }
                        }
                        
                        // Fix any objects with numeric keys
                        this.fixNumericKeyObjectsToArrays(fixedJson);
                        
                        // If we made it here, apply the fixed JSON
                        this.setJson(fixedJson);
                        this.setLastJson(fixedJson);
                        return this;
                    } catch (analyzeError) {
                        console.error("Error analyzing path:", analyzeError);
                    }
                }
            }
            */
        }
    }
    
    /**
     * Helper method to ensure all parent paths exist in a JSON object
     * @param {Object} json - The JSON object to modify
     * @param {Array} pathParts - Array of path segments
     */
    ensureParentPathsExist (json, pathParts) {
        let current = json;
        
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            
            // If we need to create a part and the next part is an integer or "-",
            // create an array; otherwise create an object
            const nextPartIsArrayIndex = 
                i + 1 < pathParts.length && 
                (Type.isInteger(pathParts[i + 1]) || pathParts[i + 1] === "-");
            
            if (current[part] === undefined || current[part] === null) {
                // Create a new object or array based on the next path part
                current[part] = nextPartIsArrayIndex ? [] : {};
            } else if (nextPartIsArrayIndex && !Array.isArray(current[part])) {
                // Convert to array if needed
                console.warn(`Converting object to array at path: /${pathParts.slice(0, i + 1).join("/")}`);
                current[part] = [];
            }
            
            current = current[part];
        }
        
        return current;
    }
    
    /**
     * Recursively fix objects with numeric keys by converting them to arrays
     * @param {Object} obj - The object to fix
     */
    fixNumericKeyObjectsToArrays (obj) {
        if (!obj || typeof obj !== 'object') return;
        
        // Process all properties of the object
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            
            // Recursively process nested objects
            if (value && typeof value === 'object') {
                // Check if this object should be an array (has only numeric keys in sequence)
                const shouldBeArray = this.shouldBeArray(value);
                
                if (shouldBeArray) {
                    // Convert the object to an array
                    const array = this.objectToArray(value);
                    obj[key] = array;
                    
                    // Recursively process each array element
                    array.forEach(item => {
                        if (item && typeof item === 'object') {
                            this.fixNumericKeyObjectsToArrays(item);
                        }
                    });
                } else {
                    // Just recursively process this object
                    this.fixNumericKeyObjectsToArrays(value);
                }
            }
        });
    }
    
    /**
     * Check if an object should actually be an array
     * @param {Object} obj - The object to check
     * @returns {boolean} - True if the object should be an array
     */
    shouldBeArray (obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
        
        const keys = Object.keys(obj);
        if (keys.length === 0) return false;
        
        // Check if all keys are numeric and sequential starting from 0
        return keys.every((key, index) => {
            const n = Number(key);
            return !isNaN(n) && n === index;
        });
    }
    
    /**
     * Convert an object with numeric keys to an array
     * @param {Object} obj - The object to convert
     * @returns {Array} - The resulting array
     */
    objectToArray (obj) {
        const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
        return keys.map(key => obj[key]);
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
     * @returns {SvJsonNode|null} The descendant node with the matching JSON ID, or null if no such node is found.
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