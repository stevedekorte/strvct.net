"use strict";

/** * @module library.node.fields.json
 */

/** * @class SvJsonArrayNode
 * @extends SvJsonNode
 * @classdesc Represents a JSON array node in the object tree.
 */

/**

 */
(class SvJsonArrayNode extends SvJsonNode {

    /**
     * @static
     * @description Checks if the node can open a specific MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} Always returns false for this class.
     * @category MIME Handling
     */
    static canOpenMimeType (/*mimeType*/) {
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

        if (this.subnodeClasses().length === 1) {
            items["$ref"] = this.subnodeClasses().first().jsonSchemaRef(refSet);
        } else {
            const refs = this.subnodeClasses().map(subnodeClass => {
                return {
                    "$ref": subnodeClass.jsonSchemaRef(refSet)
                };
            });
            if (refs.length > 0) {
                items.anyOf = refs;
            } else {
                throw new Error("SvJsonArrayNode.jsonSchemaForSubnodes() no subnode classes. Make sure setSubnodeClasses() is called in initPrototype.");
            }
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
        slot.setJsonSchemaItemsType(aClass.svType());
        this.setSubnodeClasses([aClass]);
    }

    /**
     * @description Returns the subtitle for the node.
     * @returns {string} The subtitle.
     * @category UI
     */
    subtitle () {
        if (this.thisClass().svType() === "SvJsonArrayNode") {
            return "Array"; // so we know it's an array when using the UI to assembly JSON
        }

        return super.subtitle();
    }

    /**
     * @description Replaces a subnode with a new one.
     * @param {SvJsonNode} oldNode - The node to replace.
     * @param {SvJsonNode} newNode - The new node to insert.
     * @returns {SvJsonNode} The prepared new node.
     * @category Subnode Management
     */
    replaceSubnodeWith (oldNode, newNode) {
        newNode = this.prepareSubnode(newNode);
        return super.replaceSubnodeWith(oldNode, newNode);
    }

    /**
     * @description Adds a subnode at a specific index.
     * @param {SvJsonNode} aSubnode - The subnode to add.
     * @param {number} anIndex - The index at which to add the subnode.
     * @returns {SvJsonNode} The added subnode.
     * @category Subnode Management
     */
    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(this.prepareSubnode(aSubnode), anIndex);
    }

    /**
     * @description Prepares a subnode for addition to this node.
     * @param {SvJsonNode} aSubnode - The subnode to prepare.
     * @returns {SvJsonNode} The prepared subnode.
     * @category Subnode Management
     */
    prepareSubnode (aSubnode) {
        aSubnode.setCanDelete(true);

        if (aSubnode.keyIsVisible) {
            aSubnode.setKey("");
            aSubnode.setKeyIsVisible(false);
            aSubnode.setKeyIsEditable(false);
            const editableValueTypes = ["SvStringField", "SvNumberField", "SvBooleanField"];
            if (editableValueTypes.contains(aSubnode.svType())) {
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
     * @returns {SvJsonNode} The new subnode.
     * @category Subnode Management
     */
    newSubnodeForJson (json, jsonPathComponents = []) {
        let aNode = null;
        let className = json._type;
        if (className) {
            const aClass = SvGlobals.get(className);
            if (aClass) {
                if (aClass.isKindOf(SvGlobals.get("ConversationMessage"))) {
                    //debugger;
                }
                aNode = aClass.fromJson(json, jsonPathComponents);
            }
        } else if (this.subnodeClasses().length === 1) {
            const aClass = this.subnodeClasses().first();
            if (aClass.isKindOf(SvGlobals.get("ConversationMessage"))) {
                //debugger;
            }
            aNode = aClass.clone().setJson(json, jsonPathComponents);
        } else {
            aNode = SvJsonNode.nodeForJson(json, jsonPathComponents);
        }
        return aNode;
    }

    /**
     * @description Sets the JSON for this node.
     * @param {Array} json - The JSON array to set.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Operations
     */
    setJson (json, jsonPathComponents = []) {
        /*
        if (this.doesMatchJson(json)) {
            return this;
        }
        */

        const jsonIdToSubnodeMap = new Map();
        this.subnodes().forEach(sn => {
            jsonIdToSubnodeMap.set(sn.jsonId(), sn);
        });

        const hasOldSubnodes = this.subnodes().length > 0;

        const newSubnodes = [];

        const seenJsonIds = new Set();

        //assert(Type.isArray(json), "Expected array for JSON path: '" + this.nodePathString().after("Sessions/") + "'");
        assert(Type.isArray(json), "Expected array for JSON path '" + jsonPathComponents.join("/") + "' but got: " + json);

        json.forEachKV((index, v) => {
            const pathString = jsonPathComponents.concat(index).join("/");

            assert(!Type.isNullOrUndefined(v), "Expected non-null value for JSON path: " + pathString);

            const jsonId = v.jsonId;

            if (seenJsonIds.has(jsonId)) {
                console.warn("SvJsonArrayNode.setJson() attempt to add duplicate jsonId: ", jsonId, " at path: " + pathString);
                return;
            } else {
                seenJsonIds.add(jsonId);
            }

            if (hasOldSubnodes && !jsonId) {
                console.warn("SvJsonArrayNode.setJson() missing jsonId: ", v, " at path: " + pathString);
            }

            const existingNode = jsonIdToSubnodeMap.get(jsonId);

            if (existingNode) {
                existingNode.setJson(v, jsonPathComponents.concat(index));
                newSubnodes.push(existingNode);
            } else {
                const aNode = this.newSubnodeForJson(v, jsonPathComponents.concat(index));
                newSubnodes.push(aNode);
                //console.log(this.logPrefix(), "SvJsonArrayNode.setJson() creating new node " + aNode.svType() + " for jsonId: " + jsonId + " (" + aNode.jsonId() + ")");
            }
        });

        //if (true) {
        this.subnodes().clear();
        this.subnodes().appendItems(newSubnodes);
        newSubnodes.forEach(sn => sn.setParentNode(this));
        //} else {
        //    this.setSubnodes(newSubnodes);
        //}

        return this;
    }

    /**
     * @description Calculates the JSON representation of this node.
     * @param {Object} options - Optional settings
     * @param {String} options.jsonMethodName - Method to call on subnodes (default: "asJson")
     * @returns {Array} The JSON representation.
     * @category JSON Operations
     */
    calcJson (options = {}) {
        const jsonMethodName = options.jsonMethodName || "asJson";
        //const SvField = SvGlobals.get("SvField");
        return this.subnodes().map(sn => {
            /*
            // Skip field objects - they are transient UI objects - Not true, for example in UoAiChat the subnodes are ConversationMessages and we need to store them
            if (SvField && sn.isKindOf(SvField)) {
                return undefined;
            }
            */
            const method = sn[jsonMethodName];
            if (method) {
                let json = method.call(sn);
                if (sn.isKindOf(SvGlobals.get("ConversationMessage"))) {
                    assert(Type.isString(json._type), "ConversationMessage json must have _type");
                }
                return json;
            }
            return sn.asJson(); // fallback
        }).filter(json => json !== undefined);
    }

    /**
     * @description Returns JSON representation for cloud storage.
     * @returns {Array} Array of subnodes serialized with asCloudJson
     * @category JSON Operations
     */
    asCloudJson () {
        return this.calcJson({ jsonMethodName: "asCloudJson" });
    }

    /**
     * @description Sets state from cloud JSON data.
     * @param {Array} json - The JSON array from cloud
     * @returns {SvJsonArrayNode} This instance
     * @category JSON Operations
     */
    setCloudJson (json) {
        return this.setJson(json);
    }

    async asyncPrepareForAsJson () {
        // is this safe to do in parallel?
        await this.subnodes().promiseParallelForEach(async sn => {
            if (sn.asyncPrepareForAsJson) {
                await sn.asyncPrepareForAsJson();
            }
        });
        return this;
    }

    /**
     * @description Gets the SvDataUrl for this node.
     * @returns {SvDataUrl} The SvDataUrl object.
     * @category Data Operations
     */
    getSvDataUrl () {
        const json = this.jsonArchive();
        const d = SvDataUrl.clone();
        d.setMimeType("application/json");
        d.setFileName(this.title() + ".json");
        d.setDecodedData(JSON.stableStringifyWithStdOptions(json, null, 4));
        return d;
    }

    descendantWithJsonId (jsonId, path = "") {
        if (this.jsonId() === jsonId) {
            return this;
        }
        return this.subnodes().detectAndReturnValue(sn => {
            if (sn.isKindOf(SvPointerField)) {
                sn = sn.nodeTileLink();
            }
            if (sn.descendantWithJsonId) {
                return sn.descendantWithJsonId(jsonId, path + "/" + this.jsonPathCompmentString());
            }
            return false;
        });
    }

    jsonPathCompmentString () {
        return this.svType() + ":" + this.title() + ":" + this.jsonId();
    }

}.initThisClass());
