"use strict";

/**
 * @module library.node.fields.json.BMJsonDictionaryNode
 * @class BMJsonDictionaryNode
 * @extends BMJsonNode
 * @classdesc Represents a JSON dictionary node in the BM (Blockchain Modeling) system.
 */
(class BMJsonDictionaryNode extends BMJsonNode {
    
    /**
     * @static
     * @description Checks if this node type can open a specific MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} Always returns false for this class.
     */
    static canOpenMimeType (mimeType) {
        return false;
    }

    /**
     * @description Initializes the prototype slots for this class.
     */
    initPrototypeSlots () {
        /**
         * @member {boolean} shouldMerge
         * @description Determines if the node should merge when updating JSON.
         */
        {
            const slot = this.newSlot("shouldMerge", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype with default values and settings.
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
     */
    jsonArchive () {
        // use asJson() if you want to get the json
        // jsonAcrchive is for the storable or communication version
        throw new Error("unimplemented");
    }

    /**
     * @description Sets the JSON for this node, updating its structure accordingly.
     * @param {Object} json - The JSON object to set.
     * @returns {BMJsonDictionaryNode} Returns this node after updating.
     */
    setJson (json) {
        if (this.doesMatchJson(json)) {
            return this;
        }

        assert(Type.isDictionary(json));

        const currentKeys = new Set(this.subnodes().map(sn => sn.title()));
        const newKeys = new Set(Reflect.ownKeys(json));
        const keysToRemove = Set.difference(currentKeys, newKeys);

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
                console.log("BMJsonArrayNode.setJson() creating new node for hash: ", hash);
                const aNode = this.thisClass().nodeForJson(v);
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
     * @param {BMJsonNode} newNode - The new node to add.
     * @param {number} anIndex - The index at which to add the new node.
     * @returns {BMJsonNode} The added subnode.
     */
    addSubnodeAt (newNode, anIndex) {
        newNode = this.prepareSubnode(newNode);
        return super.addSubnodeAt(this.prepareSubnode(newNode), anIndex);
    }

    /**
     * @description Replaces an existing subnode with a new one after preparing it.
     * @param {BMJsonNode} oldNode - The node to be replaced.
     * @param {BMJsonNode} newNode - The new node to replace with.
     * @returns {BMJsonNode} The new subnode that replaced the old one.
     */
    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    /**
     * @description Prepares a subnode by setting its properties.
     * @param {BMJsonNode} aSubnode - The subnode to prepare.
     * @returns {BMJsonNode} The prepared subnode.
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
     * @description Gets the BMDataUrl for this node.
     * @returns {BMDataUrl} The BMDataUrl object for this node.
     */
    getBMDataUrl () {
        const json = this.jsonArchive();
        const bdd = BMDataUrl.clone();
        bdd.setMimeType("application/json");
        bdd.setFileName(this.title() + ".json");
        bdd.setDecodedData(JSON.stableStringify(json, null, 4));
        return bdd;
    }

    /**
     * @description Sets the editable state of this node and its subnodes.
     * @param {boolean} aBool - The editable state to set.
     * @returns {BMJsonDictionaryNode} This node after setting the editable state.
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