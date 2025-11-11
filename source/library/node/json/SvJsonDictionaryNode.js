"use strict";

/**
 * @module library.node.fields.json
 * @class SvJsonDictionaryNode
 * @extends SvJsonNode
 * @classdesc Represents a JSON dictionary node in the Sv (STRVCT) system.
 */
(class SvJsonDictionaryNode extends SvJsonNode {

    /**
     * @static
     * @description Checks if this node type can open a specific MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} Always returns false for this class.
     * @category File Operations
     */
    static canOpenMimeType (/*mimeType*/) {
        return false;
    }

    /**
     * @description Initializes the prototype slots for this class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {boolean} shouldMerge
         * @description Determines if the node should merge when updating JSON.
         * @category Configuration
         */
        {
            const slot = this.newSlot("shouldMerge", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype with default values and settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
        this.setCanDelete(true);
        this.setNoteIconName("right-arrow");
        this.setSummaryFormat("key value");
        this.setHasNewLineSeparator(true);
        this.setHasNewlineAfterSummary(true);
    }

    /**
     * @description Returns the JSON archive of the node.
     * @throws {Error} Throws an error as this method is not implemented.
     * @category Data Operations
     */
    jsonArchive () {
        // use asJson() if you want to get the json
        // jsonAcrchive is for the storable or communication version
        throw new Error("unimplemented");
    }

    requiredSlotNamesSet () {
        const requiredSlotNames = new Set();
        this.allSlotsMap().forEachKV((k, v) => {
            if (v.isInJsonSchema() && v.isRequired()) {
                requiredSlotNames.add(k);
            }
        });
        return requiredSlotNames;
    }

    jsonSchemaSlotNamesSet () {
        const jsonSchemaSlotNames = new Set();
        this.allSlotsMap().forEachKV((k, v) => {
            if (v.isInJsonSchema()) {
                jsonSchemaSlotNames.add(k);
            }
        });
        return jsonSchemaSlotNames;
    }

    /**
     * @description Sets the JSON for this node, updating its structure accordingly.
     * @param {Object} json - The JSON object to set.
     * @returns {SvJsonDictionaryNode} Returns this node after updating.
     * @category Data Operations
     */
    setJson (json, jsonPathComponents = []) {

        // so if this node stores it's subodes, then whatever properties we find in the json will be added as subnodes
        // setJsonOnStoredSubnodes()
        // OTHERWISE
        // - we need to verify that all JSON schema keys are present in the JSON
        // - throw an error if there are json properties not present in the JSON schema


        if (this.doesMatchJson(json)) {
            return this;
        }

        assert(Type.isDictionary(json));

        const currentKeys = new Set(this.subnodes().map(sn => sn.title()));
        const newKeys = new Set(Reflect.ownKeys(json));
        const keysToRemove = Set.difference(currentKeys, newKeys);

        if (this.shouldStoreSubnodes()) {
            // so if this node stores it's subodes, then whatever properties we find in the json will be added as subnodes
            // as we are using this object as a free form dictionary
        } else {
            // otherwise, we need to make sure we have the correct keys

            // Check if json has invalid keys
            const invalidSlotNames = Set.difference(newKeys,  this.jsonSchemaSlotNamesSet());
            if (invalidSlotNames.size > 0) {
                throw new Error(this.svType() + ".setJson() contained invalid JSON schema keys: " + invalidSlotNames.join(", "), " at path: " + jsonPathComponents.join("/"));
            }

            // Check if all required slots are present in json
            const missingSlotNames = Set.difference(this.requiredSlotNamesSet(), newKeys);

            // - throw an error if there are json properties not present in the JSON schema
            if (missingSlotNames.size > 0) {
                throw new Error(this.svType() + ".setJson() missing required JSON schema keys: " + missingSlotNames.join(", "), " at path: " + jsonPathComponents.join("/"));
            }

            // looks good, so we can set the json normally. Fields will auto apply new values to their respective slots
        }


        // so if this node stores it's subodes, then whatever properties we find in the json will be added as subnodes
        // setJsonOnStoredSubnodes()
        // OTHERWISE
        // - we need to verify that all JSON schema keys are present in the JSON
        // - throw an error if there are json properties not present in the JSON schema


        // remove any keys that are no longer in the json
        keysToRemove.forEach((k) => {
            this.removeSubnode(this.firstSubnodeWithTitle(k));
        });

        // merge remaining keys
        json.ownForEachKV((k, v) => {
            const sn = this.firstSubnodeWithTitle(k); // do this if we want to merge
            if (this.shouldMerge() && sn) {
                sn.setJson(v);
            } else {
                console.log(this.logPrefix(), "SvJsonArrayNode.setJson() creating new node for hash: ", hash);
                const aNode = this.thisClass().nodeForJson(v, jsonPathComponents.concat(k));
                aNode.setTitle(k);
                if (aNode.setKey) {
                    aNode.setKey(k);
                }
                this.addSubnode(aNode);
            }
        });

        this.setJsonCache(json);

        return this;
    }

    /**
     * @description Calculates and returns the JSON representation of this node.
     * @returns {Object} The calculated JSON object.
     * @category Data Operations
     */
    calcJson () {
        const dict = {};
        this.subnodes().forEach((sn) => {
            const key = sn.key ? sn.key() : sn.title();
            if (sn.asJson) {
                // so we skip CreatorNode
                const value = sn.asJson();
                dict[key] = value;
            }
        });
        return dict;
    }

    /**
     * @description Adds a subnode at a specific index after preparing it.
     * @param {SvJsonNode} newNode - The new node to add.
     * @param {number} anIndex - The index at which to add the new node.
     * @returns {SvJsonNode} The added subnode.
     * @category Node Operations
     */
    addSubnodeAt (newNode, anIndex) {
        newNode = this.prepareSubnode(newNode);
        return super.addSubnodeAt(this.prepareSubnode(newNode), anIndex);
    }

    /**
     * @description Replaces an existing subnode with a new one after preparing it.
     * @param {SvJsonNode} oldNode - The node to be replaced.
     * @param {SvJsonNode} newNode - The new node to replace with.
     * @returns {SvJsonNode} The new subnode that replaced the old one.
     * @category Node Operations
     */
    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    /**
     * @description Prepares a subnode by setting its properties.
     * @param {SvJsonNode} aSubnode - The subnode to prepare.
     * @returns {SvJsonNode} The prepared subnode.
     * @category Node Operations
     */
    prepareSubnode (aSubnode) {
        this.assertValidSubnodeType(aSubnode);
        aSubnode.setCanDelete(true);

        if (aSubnode.keyIsVisible) {
            aSubnode.setKeyIsVisible(true);
            aSubnode.setKeyIsEditable(true);
        }

        aSubnode.setNodeCanEditTitle(true);
        return aSubnode;
    }

    /**
     * @description Gets the SvDataUrl for this node.
     * @returns {SvDataUrl} The SvDataUrl object for this node.
     * @category Data Operations
     */
    getSvDataUrl () {
        const json = this.jsonArchive();
        const bdd = SvDataUrl.clone();
        bdd.setMimeType("application/json");
        bdd.setFileName(this.title() + ".json");
        bdd.setDecodedData(JSON.stableStringifyWithStdOptions(json, null, 4));
        return bdd;
    }

    /**
     * @description Sets the editable state of this node and its subnodes.
     * @param {boolean} aBool - The editable state to set.
     * @returns {SvJsonDictionaryNode} This node after setting the editable state.
     * @category Node Operations
     */
    setIsEditable (aBool) {
        this.subnodes().forEach(sn => {
            if (sn.setIsEditable) {
                sn.setIsEditable(aBool);
                if (!aBool) {
                    if (sn.setNodeCanAddSubnode) {
                        sn.setNodeCanAddSubnode(false);
                    }
                }
            }
        });
        return this;
    }

}.initThisClass());
