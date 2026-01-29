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
