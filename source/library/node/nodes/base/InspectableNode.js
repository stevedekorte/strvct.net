"use strict";

/**
 * @module library.node.nodes.base
 * @class InspectableNode
 * @extends TitledNode
 * @classdesc InspectableNode
 * 
 * Handles creating inspector nodes and related fields.
 * Slot has some logic for this too.
 * 
 * Inheritance chain:
 * SvNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode
 */
(class InspectableNode extends TitledNode {

    /**
     * @description Initializes the prototype slots for the InspectableNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} nodeCanInspect
         * @category Inspection
         */
        {
            const slot = this.newSlot("nodeCanInspect", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {SvNode} nodeInspector
         * @category Inspection
         */
        {
            const slot = this.newSlot("nodeInspector", null);
            slot.setDuplicateOp("nop");
            slot.setSlotType("SvNode");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    // --- node inspector ---

    /**
     * @description Gets or creates the node inspector.
     * @returns {SvNode} The node inspector.
     * @category Inspection
     */
    nodeInspector () {
        if (!this._nodeInspector) {
            this._nodeInspector = BaseNode.clone()
            this.initNodeInspector()
        }
        return this._nodeInspector
    }

    /**
     * @description Initializes the node inspector.
     * @returns {InspectableNode} This instance.
     * @category Inspection
     */
    initNodeInspector () {  // TODO: merge with setupInspectorFromSlots?
        this.setupInspectorFromSlots()
        return this
    }

    /**
     * @description Sets up the inspector from slots.
     * @returns {InspectableNode} This instance.
     * @category Inspection
     */
    setupInspectorFromSlots () {

        if (this.isKindOf(SvPointerField)) {
            const target = this.nodeTileLink();
            if (target) {
                target.setupInspectorFromSlots();
                this.setNodeInspector(target.nodeInspector());
            }
            return this;
        }

        const slotsMap = this.thisPrototype().allSlotsMap();
        const slotNames = slotsMap.keysArray();
        
        this.nodeInspector().setTitle(this.title() + " inspector");

        {
            // move "type" slot to first item
            const s = "nodeType";
            if (slotNames.includes(s)) {
                slotNames.remove(s);
                slotNames.unshift(s);
            }
        }
        
        slotNames.forEachV(slotName => {
            const slot = slotsMap.get(slotName);

            if (slot.canInspect()) {
                const field = slot.newInspectorField();
                let pathNodes = null;

                if (field) {
                    field.setOwnerNode(this);
                    field.setTarget(this);
                    field.setCanDelete(false);
                    pathNodes = this.nodeInspector().createNodePath(slot.inspectorPath());
                    pathNodes.last().addSubnode(field);
                } else {
                    const node = slot.onInstanceGetValue(this);
                    if (node === null || (Type.isObject(node) && node.thisClass().isKindOf(SvNode))) {
                        const linkNode = SvLinkNode.clone().setLinkedNode(node);
                        linkNode.setCanDelete(false) ;
                        pathNodes = this.nodeInspector().createNodePath(slot.inspectorPath());
                        pathNodes.last().addSubnode(linkNode);
                    } else {
                        throw new Error(this.type() + "." + slot.name() + " must have it's slotType set to be inspected");
                    }
                }

                pathNodes.forEach(pathNode => { 
                    pathNode.setCanDelete(false) ;
                })
            }
        })
        return this
    }    

    // --- helpful for setting up inspector paths ---

    /**
     * @description Creates a node path.
     * @param {string} aPath - The path to create.
     * @param {string} [pathSubnodeType="SvFolderNode"] - The type of subnodes to create.
     * @returns {Array} An array of path nodes.
     * @category Path
     */
    createNodePath (aPath, pathSubnodeType = "SvFolderNode") {
        const pathNodes = [this];

        if (aPath) {
            const components = aPath.split("/");
            let node = this;

            components.forEach(component => {
                node = node.subnodeWithTitleIfAbsentInsertClosure(component, () => {
                    //debugger
                    const nodeClass = Object.getClassNamed(pathSubnodeType);
                    const newNode = nodeClass.clone();
                    newNode.setNodeCanReorderSubnodes(false); // should this be here?
                    newNode.setTitle(component);
                    newNode.setSubtitle(null);
                    newNode.setNodeCanAddSubnode(false);
                    return newNode;
                })
                pathNodes.push(node);
            })
        }

        return pathNodes;
    }

    // --- fields ---
    
    /*
    addLinkFieldForNode (aNode) {
        const field = SvLinkField.clone().setName(aNode.title()).setValue(aNode)
        return this.addStoredField(field)
    }
    */
    
    /**
     * @description Adds a field to the node.
     * @param {Object} aField - The field to add.
     * @throws {Error} Should not be called directly.
     * @category Field
     */
    addField (/*aField*/) {
        throw new Error("addField shouldn't be called - use SvFieldSetNode");
        //return this.addSubnode(aField);
    }
    
    /**
     * @description Gets the node tile link.
     * @returns {InspectableNode} This instance.
     * @category UI
     */
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return this
    }

    // nodeTileLinkMethods
    // used by UI tile views to choose the node ref to use for the next column
    // if returns null, the tile won't open another column
    // 
    // The two typical use cases are :
    //
    // 1) A pointer tile which links to some other node.
    //
    // 2) A means to toggle between viewing the row's node or
    //    skipping to one of its subnodes. This allows a node
    //    to have inspector separated from "subnode" browsing.
    //    Example: a Server object might have the subnodes:
    //    [ StringFieldNode (for server name),  
    //      ActionNode (to connect/disconnect),
    //      ServerClientsNode (holds list of connected server clients)
    //

    /**
     * @description Gets this node.
     * @returns {InspectableNode} This instance.
     * @category UI
     */
    thisNode () {
        return this;
    }

    /**
     * @description Gets the node tile link methods.
     * @returns {Array} An array of method names.
     * @category UI
     */
    nodeTileLinkMethods () {
        return ["thisNode"];
    }

    /**
     * @description Gets the default node tile link method.
     * @category UI
     */
    defaultNodeTileLinkMethod () {
    }

    // --- adding fields as subnodes ---

    /**
     * @description Adds subnode fields for the given slots.
     * @param {Array} slots - An array of slots to add fields for.
     * @category Field
     */
    addSubnodeFieldsForSlots (slots) {
        slots.forEach(slot => {
            this.addSubnodeFieldForSlot(slot);
        });
    }

    /**
     * @description Adds a subnode field for the given slot.
     * @param {Object} slot - The slot to add a field for.
     * @returns {InspectableNode} This instance.
     * @category Field
     */
    addSubnodeFieldForSlot (slot) {
        //const name = slot.name();
        const field = slot.newInspectorField();
        if (!field) {
            const className = slot.fieldInspectorViewClassName();
            throw new Error("no field class '" + className + "' found for slot '" + slot.name() + "' on type '" + this.type() + "'");
        }

        field.setOwnerNode(this);

        if (field.setFieldSlotName) {
            field.setFieldSlotName(slot.name()); //is this used?
            debugger;
        }

        field.setShouldStore(false);
        field.setShouldStoreSubnodes(false);

        field.setTarget(this); // redundant?
        field.setNodeCanEditTitle(false);
        field.setValueIsEditable(slot.canEditInspection());
        field.setNodeCanReorderSubnodes(false);
        field.setSummaryFormat(slot.summaryFormat());
        field.setHasNewlineAfterSummary(true);
        field.setNodeCanAddSubnode(false);
        field.setCanDelete(false);
        field.setIsVisible(slot.isSubnodeFieldVisible());
        

        //field.syncFromTarget(); // new: to fix boolean sync issues

        if (field.type() === "SvBooleanField") {
            //debugger;
            //const v = slot.onInstanceGetValue(this);
            field.syncFromTarget();
            assert(field.value() === slot.onInstanceGetValue(this));
        }
        /*
        if (name === "isAvailable") {
            debugger;
        }
        */
       
        const pathNodes = this.createInspectorNodePath(slot.inspectorPath());

        /*
        const node = pathNodes.last();
        if (node !== this) {
            node.setNodeSubtitleIsChildrenSummary(true);
        }
        */

        field.setKeyIsVisible(slot.keyIsVisible() !== false);

        if (pathNodes.length > 1) {
            pathNodes.last().setNodeFillsRemainingWidth(slot.nodeFillsRemainingWidth());
            //field.setNodeFillsRemainingWidth(slot.nodeFillsRemainingWidth());
        }
        pathNodes.last().addSubnode(field);
        return this;
    }

    /**
     * @description Creates an inspector node path.
     * @param {string} aPath - The path to create.
     * @returns {Array} An array of path nodes.
     * @category Path
     */
    createInspectorNodePath (aPath) {
        const pathNodes = this.createNodePath(aPath);
        pathNodes.forEach(node => {
            if (node !== this) {
                node.setNodeSubtitleIsChildrenSummary(true);
                node.setHasNewlineAfterSummary(true);
                if (node !== pathNodes.last()) {
                    node.setHasNewLineSeparator(true);
                }
            }
        });
        return pathNodes;
    }

    subnodeFields () {
        return this.subnodes().filter(subnode => {
            return subnode.isKindOf(SvFieldNode);
        });
    }

    existingSubnodeFieldForSlot (slot) {
        const match = this.subnodeFields().find(subnode => {
            return subnode.fieldSlotName() === slot.name();
        });
        return match;
    }

}.initThisClass());