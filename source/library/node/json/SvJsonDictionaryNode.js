"use strict";

/**
 * @module library.node.fields.json
 */

/**
 * @class SvJsonDictionaryNode
 * @extends SvJsonNode
 * @classdesc Represents a JSON dictionary node in the Sv (STRVCT) system.
 *
 * Notes:
 * This was deigned aroung being able to edit JSON within the strvct UI
 * - drop json strings into the UI to create new nodes
 * - drag nodes out of the UI to create json strings (see SvTile_dragging.js and getSvDataUrl method)
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
        this.addProtocol(SvJsonSerializableProtocol);
        this.setNodeCanEditTitle(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
        this.setCanDelete(true);
        this.setNoteIconName("right-arrow");
        this.setSummaryFormat("{key}\n{value}");
        this.setHasNewLineSeparator(true);
        this.setHasNewlineAfterSummary(true);
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
     * @description Calculates and returns the JSON representation of this node.
     * @returns {Object} The calculated JSON object.
     * @category Data Operations
     */

    serializeToJson (filterName, jsonPathComponents = []) {
        const dict = {};
        this.subnodes().forEach((sn) => {
            const key = sn.key ? sn.key() : sn.title();
            if (sn.serializeToJson) {
                // so we skip CreatorNode
                const value = sn.serializeToJson(filterName, jsonPathComponents.concat(key));
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
