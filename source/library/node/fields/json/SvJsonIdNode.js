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

}.initThisClass());