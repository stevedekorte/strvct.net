"use strict";

/**
 * @module library.node.fields.json
 * @class SvJsonIdNode
 * @extends SvSummaryNode
 * @classdesc Represents a JSON node that has a unique id used to identify it in JSON patches (so we can merga array patches properly).
 */
(class SvJsonIdNode extends SvSummaryNode {

    /**
     * @description Initializes the prototype slots.
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
            slot.setDuplicateOp("copyValue");
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
     * @returns {SvJsonIdNode} The current instance.
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
     * @returns {SvJsonIdNode} The current instance.
     * @category Initialization
     */
    createJsonId () {
        assert(this.jsonId() === null);
        this.setJsonId(Object.newUuid());
        return this;
    }

    /**
     * @description Assigns new unique JSON IDs to this node and all its JSON descendants.
     * @returns {SvJsonIdNode} The current instance.
     * @category Initialization
     */
    regenerateJsonIds () {
        this.setJsonId(Object.newUuid());
        this.nextJsonDescendants().forEach(sn => {
            if (sn && sn.regenerateJsonIds) {
                sn.regenerateJsonIds();
            }
        });
        return this;
    }

    /**
     * @description Collects all jsonIds from this node and its JSON descendants into the given map.
     * @param {Map} idToNode - Map from jsonId to the node that owns it.
     * @returns {Map} The populated map.
     * @category Validation
     */
    collectJsonIds (idToNode = new Map()) {
        const id = this.jsonId();
        if (id !== null) {
            idToNode.set(id, this);
        }
        this.nextJsonDescendants().forEach(sn => {
            if (sn && sn.collectJsonIds) {
                sn.collectJsonIds(idToNode);
            }
        });
        return idToNode;
    }

    /**
     * @description Checks that no jsonIds are shared between this node's descendants and another node's descendants.
     * @param {SvJsonIdNode} otherNode - The other node tree to check against.
     * @throws {Error} If any shared jsonIds are found.
     * @returns {SvJsonIdNode} The current instance.
     * @category Validation
     */
    verifyNoSharedJsonIds (otherNode) {
        const ourIds = this.collectJsonIds();
        const theirIds = otherNode.collectJsonIds();
        const shared = [];
        ourIds.forEach((node, id) => {
            if (theirIds.has(id)) {
                shared.push(id);
            }
        });
        if (shared.length > 0) {
            throw new Error(this.svType() + " shares " + shared.length + " jsonId(s) with " + otherNode.svType() + ": " + shared.join(", "));
        }
        return this;
    }

    /**
     * @description Checks that no two descendants of this node share the same jsonId.
     * @throws {Error} If any duplicate jsonIds are found within this tree.
     * @returns {SvJsonIdNode} The current instance.
     * @category Validation
     */
    verifyNoDuplicateJsonIds () {
        const idToPath = new Map();
        const duplicates = [];
        this._collectJsonIdsWithPaths(idToPath, duplicates, [this.title()]);
        if (duplicates.length > 0) {
            throw new Error(this.svType() + " has " + duplicates.length + " duplicate jsonId(s): " + duplicates.join(", "));
        }
        return this;
    }

    /**
     * @description Helper to collect jsonIds with their paths for duplicate detection.
     * @param {Map} idToPath - Map from jsonId to the path where it was first seen.
     * @param {Array} duplicates - Array to collect duplicate jsonId strings.
     * @param {Array} path - Current path in the tree.
     * @category Validation
     * @private
     */
    _collectJsonIdsWithPaths (idToPath, duplicates, path) {
        const id = this.jsonId();
        if (id !== null) {
            if (idToPath.has(id)) {
                duplicates.push(id + " (at " + path.join("/") + " and " + idToPath.get(id) + ")");
            } else {
                idToPath.set(id, path.join("/"));
            }
        }
        this.nextJsonDescendants().forEach(sn => {
            if (sn && sn._collectJsonIdsWithPaths) {
                sn._collectJsonIdsWithPaths(idToPath, duplicates, path.concat([sn.title()]));
            }
        });
    }

    /**
     * @description Finds a descendant node (including self) with the given JSON ID.
     * @param {string} jsonId - The JSON ID to search for.
     * @returns {SvJsonNode|null} The descendant node with the matching JSON ID, or null if no such node is found.
     * @category Node Search
     */
    descendantWithJsonId (jsonId, path = "") {
        if (this.jsonId() === jsonId) {
            return this;
        }
        const newPath = path + "/" + this.jsonPathCompmentString();
        //console.log("[[" + newPath + "]] .descendantWithJsonId('" + jsonId + "') != '" + this.jsonId() + "'");

        const result = this.nextJsonDescendants().detectAndReturnValue(sn => {
            if (sn) {
                if (sn.isKindOf(SvPointerField)) {
                    sn = sn.nodeTileLink();
                }

                if (sn.isKindOf(SvNode)) {
                    if (sn.descendantWithJsonId) {
                        const result = sn.descendantWithJsonId(jsonId, newPath);
                        return result;
                    } else {
                        console.log(this.jsonPathCompmentString() + " descendant (", sn, ") does not have descendantWithJsonId method");
                        debugger;
                    }
                }
            }
            return null;
        });
        return result;
    }

    descendantWithJsonIdOrThrow (jsonId, path = "") {
        const result = this.descendantWithJsonId(jsonId, path);
        if (!result) {
            throw new Error("Descendant with jsonId: " + jsonId + " not found");
        }
        return result;
    }

    // -- multiple descendants --

    descendantsWithJsonIds (jsonIds) {
        return jsonIds.map(jsonId => this.descendantWithJsonId(jsonId));
    }

    descendantsWithJsonIdsOrThrow (jsonIds) {
        return jsonIds.map(jsonId => this.descendantWithJsonIdOrThrow(jsonId));
    }

    // -- json path completion --

    jsonPathCompmentString () {
        return this.svType() + ":" + this.title() + ":" + this.jsonId();
    }

    nextJsonDescendants () {
        let target = this;
        assert(!target.isKindOf(SvPointerField), "target is a pointer field");
        /*
        if (target.isKindOf(SvPointerField)) {
            target = target.nodeTileLink();
        }
        */

        if (target.shouldStoreSubnodes()) {
            return target.subnodes();
        }

        return target.jsonSchemaSlotValues();
    }

    jsonSchemaSlotValues () {
        return this.thisClass().jsonSchemaSlots().map(slot => slot.onInstanceRawGetValue(this));
    }


    // DEPRECATED METHODS

    json () {
        throw new Error("json() deprecated - use serializeToJson instead");
    }

    static fromJsonArchive (/*json*/) {
        throw new Error("fromJsonArchive deprecated - use cloneDeserializeFromJson instead");
    }

    setJsonArchive (/*json*/) {
        throw new Error("setJsonArchive deprecated - use deserializeFromJson instead");
    }

    jsonArchive () {
        throw new Error("jsonArchive() deprecated - use serializeToJson instead");
    }

    serializeToJsonString (filterName, jsonPathComponents = []) {
        return JSON.stableStringifyWithStdOptions(this.serializeToJson(filterName, jsonPathComponents), null, 4); // will default to isInJsonSchema slots
    }


    // ==============================================

    // UNIMPLEMENTED METHODS

    // --- serialization ---

    /*
    serializeToJson (filterName, pathComponents = []) {
        throw new Error("serializeToJson should be implemented by subclasses");
    }


    // --- deserializion ---

    cloneDeserializeFromJson (json, filterName, pathComponents = []) {
        throw new Error("cloneDeserializeFromJson not implemented for " + this.svType() + " at path: " + pathComponents.join("/"));
    }
    */

    deserializeFromJson (json, filterName, pathComponents = []) {
        throw new Error("deserializeFromJson not implemented for " + this.svType() + " at path: " + pathComponents.join("/"));
    }

    asJsonString () { // deprecate soon?
        throw new Error("asJsonString deprecated - use serializeToJsonString instead");
    }

    setJson (json) {
        return this.deserializeFromJson(json, null, []);
    }

    asJson () {
        return this.serializeToJson(null, []);
    }


    /*
    // TODO: add AiJson support
    asAiJson () {
        return this.serializeToJson("Ai", []);
    }

    setAiJson (json) {
        return this.deserializeFromJson(json, "Ai", []);
    }
    */

}.initThisClass());
