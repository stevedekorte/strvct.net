"use strict";

/**
 * @module library.node.fields.json
 * @class BMJsonArrayNode
 * @extends BMJsonNode
 * @classdesc Represents a JSON array node in the object tree.
 */
(class BMJsonArrayNode extends BMJsonNode {
    
    /**
     * @static
     * @description Checks if the node can open a specific MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} Always returns false for this class.
     * @category MIME Handling
     */
    static canOpenMimeType (mimeType) {
        return false;
    }

    /**
     * @static
     * @description Checks if the node is available as a primitive.
     * @returns {boolean} Always returns true for this class.
     * @category Node Properties
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @static
     * @description Returns the default JSON value for this node type.
     * @returns {Array} An empty array.
     * @category JSON Operations
     */
    static jsonDefaultValue () {
        return [];
    }

    /**
     * @static
     * @description Generates a JSON schema for this node type.
     * @param {Set} refSet - A set of references.
     * @returns {Object} The JSON schema object.
     * @category JSON Schema
     */
    static asJsonSchema (refSet) {
        assert(Type.isSet(refSet));
        const schema = {
            type: "array",
            title: this.jsonSchemaTitle(),
            description: this.jsonSchemaDescription(),
            default: this.jsonDefaultValue(),
            items: this.prototype.jsonSchemaForSubnodes(refSet) // prototype method
        };

        return schema;
    }

    /**
     * @description Generates a JSON schema for subnodes.
     * @param {Set} refSet - A set of references.
     * @returns {Object} The JSON schema object for subnodes.
     * @category JSON Schema
     */
    jsonSchemaForSubnodes (refSet) { // NOTE: method on prototype, not class
        assert(refSet);
        const items = {};
        const refs = this.subnodeClasses().map(subnodeClass => {
            return { 
                "$ref": subnodeClass.jsonSchemaRef(refSet)
            };
        });
        if (refs.length > 0) {
            items.anyOf = refs;
        } else {
            throw new Error("BMJsonArrayNode.jsonSchemaForSubnodes() no subnode classes. Make sure setSubnodeClasses() is called in initPrototype.");
        }
        return items;
    }
    
    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Sets up the subnodes slot with a specific item type.
     * @param {Function} aClass - The class to use for subnodes.
     * @category Subnode Management
     */
    setupSubnodesSlotWithItemType (aClass) {
        const slot = this.overrideSlot("subnodes");
        slot.setIsInJsonSchema(true);
        slot.setShouldJsonArchive(true);
        slot.setJsonSchemaItemsType("CharacterClass");
        this.setSubnodeClasses([CharacterClass]);
    }

    /**
     * @description Returns the subtitle for the node.
     * @returns {string} The subtitle.
     * @category UI
     */
    subtitle () {
        if (this.thisClass().type() === "BMJsonArrayNode") {
            return "Array"; // so we know it's an array when using the UI to assembly JSON
        }

        return super.subtitle();
    }

    /**
     * @description Replaces a subnode with a new one.
     * @param {BMJsonNode} oldNode - The node to replace.
     * @param {BMJsonNode} newNode - The new node to insert.
     * @returns {BMJsonNode} The prepared new node.
     * @category Subnode Management
     */
    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    /**
     * @description Adds a subnode at a specific index.
     * @param {BMJsonNode} aSubnode - The subnode to add.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {BMJsonNode} The added subnode.
     * @category Subnode Management
     */
    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(this.prepareSubnode(aSubnode), anIndex);
    }

    /**
     * @description Prepares a subnode for addition to this node.
     * @param {BMJsonNode} aSubnode - The subnode to prepare.
     * @returns {BMJsonNode} The prepared subnode.
     * @category Subnode Management
     */
    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true);

        if (aSubnode.keyIsVisible) {
            aSubnode.setKey("");
            aSubnode.setKeyIsVisible(false);
            aSubnode.setKeyIsEditable(false);
            const editableValueTypes = ["BMStringField", "BMNumberField", "BMBooleanField"];
            if (editableValueTypes.contains(aSubnode.type())) {
                aSubnode.setValueIsEditable(true);
            }
         }

        aSubnode.setNodeCanEditTitle(false);
        return aSubnode;
    }

    /**
     * @description Creates a JSON archive of this node.
     * @returns {Array} The JSON archive.
     * @category JSON Operations
     */
    jsonArchive () {
        return this.subnodes().map(sn => sn.jsonArchive());
    }

    /**
     * @description Creates a new subnode for a given JSON object.
     * @param {Object} json - The JSON object to create a subnode for.
     * @returns {BMJsonNode} The new subnode.
     * @category Subnode Management
     */
    newSubnodeForJson (json) {
        let aNode = null;
        if (this.subnodeClasses().length === 1) {
            const aClass = this.subnodeClasses().first();
            aNode = aClass.clone().setJson(json);
        } else {
            aNode = BMJsonNode.nodeForJson(json);
        }
        return aNode;
    }

    /**
     * @description Sets the JSON for this node.
     * @param {Array} json - The JSON array to set.
     * @returns {BMJsonArrayNode} This node.
     * @category JSON Operations
     */
    setJson (json) {
        if (this.doesMatchJson(json)) {
            return this;
        }

        const jsonIdToSubnodeMap = new Map();
        this.subnodes().forEach(sn => {
            jsonIdToSubnodeMap.set(sn.jsonId(), sn);
        });

        const hasOldSubnodes = this.subnodes().length > 0;

        const newSubnodes = [];

        const seenJsonIds = new Set();

        json.forEach((v) => {
            const jsonId = v.jsonId;

            if (seenJsonIds.has(jsonId)) {
                console.warn("BMJsonArrayNode.setJson() attempt to add duplicate jsonId: ", jsonId);
                return;
            } else {
                seenJsonIds.add(jsonId);
            }

            if (hasOldSubnodes && !jsonId) {
                console.warn("BMJsonArrayNode.setJson() missing jsonId: ", v);
            }

            const existingNode = jsonIdToSubnodeMap.get(jsonId);

            if (existingNode) {
                existingNode.setJson(v);
                newSubnodes.push(existingNode);
            } else {
                const aNode = this.newSubnodeForJson(v);
                newSubnodes.push(aNode);
                console.log("BMJsonArrayNode.setJson() creating new node " + aNode.type() + " for jsonId: " + jsonId + " (" + aNode.jsonId() + ")");
            }
        });

        if (true) {
            this.subnodes().clear();
            this.subnodes().appendItems(newSubnodes);
        } else {
            this.setSubnodes(newSubnodes);
        }

        return this;
    }

    /**
     * @description Calculates the JSON representation of this node.
     * @returns {Array} The JSON representation.
     * @category JSON Operations
     */
    calcJson () {
        return this.subnodes().map(sn => sn.asJson());
    }

    /**
     * @description Gets the BMDataUrl for this node.
     * @returns {BMDataUrl} The BMDataUrl object.
     * @category Data Operations
     */
    getBMDataUrl () {
        const json = this.jsonArchive();
        const d = BMDataUrl.clone();
        d.setMimeType("application/json");
        d.setFileName(this.title() + ".json");
        d.setDecodedData(JSON.stableStringifyWithStdOptions(json, null, 4));
        return d;
    }

}.initThisClass());