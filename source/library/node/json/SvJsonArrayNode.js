"use strict";

/** * @module library.node.fields.json
 */

/** * @class SvJsonArrayNode
 * @extends SvJsonNode
 * @classdesc Represents a JSON array node in the object tree.
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
     * @description Whether deserializeFromJson should retain current
     * subnodes that are absent from the incoming json (append-only)
     * rather than dropping them. Default false (normal replace). Opt in
     * for collections that only ever grow and may receive entries via a
     * side-channel ahead of the authoritative snapshot (e.g. a
     * multiplayer client's narration thread). See deserializeFromJson.
     * @returns {boolean}
     * @category JSON Operations
     */
    subnodesAreAppendOnly () {
        return this._subnodesAreAppendOnly === true;
    }

    /**
     * @param {boolean} b
     * @returns {SvJsonArrayNode}
     * @category JSON Operations
     */
    setSubnodesAreAppendOnly (b) {
        this._subnodesAreAppendOnly = b;
        return this;
    }

    /*
    onBrowserDropChunk (dataChunk) {
        if (dataChunk.mimeType() === "application/json") {
            try {
                const json = JSON.parse(dataChunk.decodedData());
                const subnodeClasses = this.subnodeClasses();
                const jsonType = json._type;
                let subnodeClass = null;
                if (subnodeClasses.length === 1) {
                    subnodeClass = subnodeClasses.first();
                } else {
                    subnodeClass = subnodeClasses.detect(cls => cls.svType() === jsonType);
                }
                if (subnodeClass) {
                    const campaign = subnodeClass.clone().deserializeFromJson(json, null, []);
                    this.addSubnode(campaign);
                } else {
                    console.error(this.logPrefix(), "Error importing campaign JSON: unknown type:", jsonType);
                    SvWindowErrorPanel.shared().showPanelWithInfo({ message: "Failed to import campaign: unknown type: " + jsonType });
                }
                this.addSubnode(campaign);
            } catch (error) {
                console.error(this.logPrefix(), "Error importing campaign JSON:", error);
                SvWindowErrorPanel.shared().showPanelWithInfo({ message: "Failed to import campaign: " + error.message });
            }
        } else {
            super.onBrowserDropChunk(dataChunk);
        }
    }
        */

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
     * @description Creates a new subnode for a given JSON object.
     * @param {Object} json - The JSON object to create a subnode for.
     * @returns {SvJsonNode} The new subnode.
     * @category Subnode Management
     */
    newSubnodeForJson (json, filterName, jsonPathComponents = []) {
        let aNode = null;
        let className = json._type;
        if (className) {
            const aClass = SvGlobals.get(className);
            if (aClass) {
                aNode = aClass.fromJson(json, jsonPathComponents);
            }
        } else if (this.subnodeClasses().length === 1) { // only one subnode class, so we can use the clone method
            const aClass = this.subnodeClasses().first();
            aNode = aClass.clone().deserializeFromJson(json, filterName, jsonPathComponents);
        } else {
            //debugger; // should not happen
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
    deserializeFromJson (json, filterName, jsonPathComponents = []) {
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

            if (jsonId !== undefined && jsonId !== null) {
                if (seenJsonIds.has(jsonId)) {
                    console.warn("SvJsonArrayNode.setJson() attempt to add duplicate jsonId: ", jsonId, " at path: " + pathString);
                    return;
                } else {
                    seenJsonIds.add(jsonId);
                }
            }

            if (hasOldSubnodes && !jsonId) {
                console.warn("SvJsonArrayNode.setJson() missing jsonId: ", v, " at path: " + pathString);
            }

            const existingNode = jsonIdToSubnodeMap.get(jsonId);

            if (existingNode) {
                existingNode.deserializeFromJson(v, filterName, jsonPathComponents.concat(index));
                newSubnodes.push(existingNode);
            } else {
                const aNode = this.newSubnodeForJson(v, filterName, jsonPathComponents.concat(index));
                newSubnodes.push(aNode);
                //console.log(this.logPrefix(), "SvJsonArrayNode.setJson() creating new node " + aNode.svType() + " for jsonId: " + jsonId + " (" + aNode.jsonId() + ")");
            }
        });

        // Append-only mode (opt-in via setSubnodesAreAppendOnly(true)):
        // retain current subnodes that are absent from the incoming json
        // instead of dropping them. This is for collections that only
        // ever grow (e.g. a multiplayer client's narration thread), where
        // a message can be added locally via a fast side-channel BEFORE
        // the lagging pool snapshot includes it. Without this, the next
        // pool deserialize would build newSubnodes purely from the (stale)
        // snapshot and the clear()+rebuild would delete the not-yet-synced
        // message — it "appears then disappears". When the snapshot later
        // catches up, the message matches by jsonId and updates in place.
        // (Retained nodes are appended after the canonical ones — they are
        // the newest, ahead-of-snapshot entries.)
        // Skip retention when the incoming snapshot is EMPTY — that's a
        // deliberate clear (e.g. host "Restart Session" → aiChat.clear()),
        // not the snapshot merely lagging. Retaining here would leave
        // stale messages forever after a reset. A non-empty snapshot that
        // simply omits a just-arrived message is the lag case we retain.
        if (this.subnodesAreAppendOnly() && json.length > 0) {
            this.subnodes().forEach(sn => {
                const jid = sn.jsonId();
                if (jid === undefined || jid === null) return;
                if (!seenJsonIds.has(jid)) {
                    newSubnodes.push(sn);
                    seenJsonIds.add(jid);
                }
            });
        }

        // Only rebuild the subnodes array when the membership/order
        // actually changed. Existing nodes have already had their
        // content updated in-place above (existingNode.deserializeFromJson),
        // so when the resulting list is identical to the current one
        // (same instances, same order) the clear()+appendItems() below
        // is a no-op that still fires spurious remove/add subnode
        // notifications — tearing down and rebuilding views for no
        // reason. On a multiplayer client re-applying a pool snapshot
        // every few seconds this manifests as the chat/list visibly
        // "jumping" / flickering on each sync.
        const current = this.subnodes();
        let unchanged = current.length === newSubnodes.length;
        if (unchanged) {
            for (let i = 0; i < newSubnodes.length; i++) {
                if (current[i] !== newSubnodes[i]) {
                    unchanged = false;
                    break;
                }
            }
        }
        if (!unchanged) {
            this.subnodes().clear();
            this.subnodes().appendItems(newSubnodes);
            newSubnodes.forEach(sn => sn.setParentNode(this));
        }

        return this;
    }

    /**
     * @description Creates a JSON archive of this node.
     * @returns {Array} The JSON archive.
     * @category JSON Operations
     */
    static maxSerializationDepth () {
        return 100; // Reasonable limit for nested JSON structures
    }

    serializeToJson (filterName, pathComponents = [], visitedSet = null) {
        // Initialize visitedSet at the root call to detect circular references
        if (visitedSet === null) {
            visitedSet = new WeakSet();
        }

        // Check for excessive depth (likely indicates a problem in the data structure)
        const maxDepth = this.thisClass().maxSerializationDepth();
        if (pathComponents.length > maxDepth) {
            const identifier = this.title ? this.title() : (this.name ? this.name() : (this.jsonId ? this.jsonId() : "unknown"));
            throw new Error(
                "serializeToJson: maximum depth (" + maxDepth + ") exceeded\n" +
                "  Type: " + this.svType() + "\n" +
                "  Identifier: " + identifier + "\n" +
                "  Path: " + pathComponents.join("/") + "\n" +
                "  This usually indicates a circular reference or unexpectedly deep nesting."
            );
        }

        // Check for circular reference
        if (visitedSet.has(this)) {
            const identifier = this.title ? this.title() : (this.name ? this.name() : (this.jsonId ? this.jsonId() : "unknown"));
            throw new Error(
                "serializeToJson: circular reference detected\n" +
                "  Type: " + this.svType() + "\n" +
                "  Identifier: " + identifier + "\n" +
                "  Path: " + pathComponents.join("/")
            );
        }
        visitedSet.add(this);

        const results = [];
        this.subnodes().forEach((sn, index) => {
            const result = sn.serializeToJson(filterName, pathComponents.concat(index), visitedSet);
            if (result !== undefined) {
                results.push(result);
            }
        });
        return results;
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
        const json = this.serializeToJson(null, []);
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
