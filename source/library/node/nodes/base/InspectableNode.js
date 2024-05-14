"use strict";

/*

    InspectableNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Handles creating inspector nodes and related fields.
    Slot has some logic for this too.

*/

(class InspectableNode extends ActionableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("nodeCanInspect", true)
            slot.setDuplicateOp("copyValue")
        }

        {
            const slot = this.newSlot("nodeInspector", null)
            slot.setDuplicateOp("nop")
        }
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // --- node inspector ---

    nodeInspector () {
        if (!this._nodeInspector) {
            this._nodeInspector = BaseNode.clone()
            this.initNodeInspector()
        }
        return this._nodeInspector
    }

    initNodeInspector () {  // TODO: merge with setupInspectorFromSlots?
        this.setupInspectorFromSlots()
        return this
    }

    setupInspectorFromSlots () {
        const slotsMap = this.thisPrototype().allSlotsMap()
        const slotNames = slotsMap.keysArray()
        
        this.nodeInspector().setTitle(this.title() + " inspector")
        {
            // move "type" slot to first item
            const s = "nodeType"
            if (slotNames.indexOf(s !== -1)) {
                slotNames.remove(s)
                slotNames.unshift(s)
            }
        }
        
        slotNames.forEachV(slotName => {
            const slot = slotsMap.at(slotName)
            if (slot.canInspect()) {
                const field = slot.newInspectorField()
                let pathNodes = null

                if (field) {
                    field.setTarget(this)
                    field.setCanDelete(false) 
                    pathNodes = this.nodeInspector().createNodePath(slot.inspectorPath())
                    pathNodes.last().addSubnode(field)
                } else {
                    const node = slot.onInstanceGetValue(this)
                    if (Type.isBoolean(node) || Type.isNumber(node)) {
                        // we assume slot value will be a node if not specified but it's not a node!
                        throw new Error(this.type() + "." + slot.name() + " must have it's slotType set to be inspected")
                    }
                    assert(node === null || (Type.isObject(node) && node.thisClass().isKindOf(BMNode)));
                    const linkNode = BMLinkNode.clone().setLinkedNode(node)
                    linkNode.setCanDelete(false) 
                    pathNodes = this.nodeInspector().createNodePath(slot.inspectorPath())
                    pathNodes.last().addSubnode(linkNode)
                }

                pathNodes.forEach(pathNode => { 
                    pathNode.setCanDelete(false) 
                })
            }
        })
        return this
    }    

    // --- helpful for setting up inspector paths ---

    createNodePath (aPath, pathSubnodeType = "BMFolderNode") {
        const pathNodes = [this]

        if (aPath) {
            const components = aPath.split("/")
            let node = this

            components.forEach(component => {
                node = node.subnodeWithTitleIfAbsentInsertClosure(component, () => {
                    //debugger
                    const nodeClass = Object.getClassNamed(pathSubnodeType)
                    const newNode = nodeClass.clone()
                    newNode.setNodeCanReorderSubnodes(false) // should this be here?
                    newNode.setTitle(component)
                    newNode.setCanAdd(false)
                    return newNode
                })
                pathNodes.push(node)
            })
        }

        return pathNodes
    }

    // --- fields ---
    
    /*
    addLinkFieldForNode (aNode) {
        const field = BMLinkField.clone().setName(aNode.title()).setValue(aNode)
        return this.addStoredField(field)
    }
    */
    
    addField (aField) {
        throw new Error("addField shouldn't be called - use BMFieldSetNode")
        return this.addSubnode(aField)
    }
    
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

    thisNode () {
        return this
    }

    nodeTileLinkMethods () {
        return ["thisNode"]
    }

    defaultNodeTileLinkMethod () {

    }

    // --- adding fields as subnodes ---

    addSubnodeFieldsForSlots (slots) {
        slots.forEach(slot => {
            this.addSubnodeFieldForSlot(slot);
        })
    }

    addSubnodeFieldForSlot (slot) {
        const name = slot.name();
        const field = slot.newInspectorField();
        if (!field) {
            const className = slot.fieldInspectorClassName();
            throw new Error("no field class '" + className + "' found for slot '" + slot.name() + "' on type '" + this.type() + "'");
        }

        if (field.setFieldSlotName) {
            field.setFieldSlotName(slot.name()); //is this used?
            debugger;
        }

        field.setShouldStore(false);
        field.setShouldStoreSubnodes(false);

        field.setTarget(this);
        field.setNodeCanEditTitle(false);
        field.setValueIsEditable(slot.canEditInspection());
        field.setNodeCanReorderSubnodes(false);
        field.setSummaryFormat(slot.summaryFormat());
        field.setHasNewlineAferSummary(true);
        field.setCanAdd(false);
        field.setCanDelete(false);
        field.setIsVisible(slot.isSubnodeFieldVisible());
        
        /*
        if (name === "isAvailable") {
            debugger;
        }
        */
       
        const pathNodes = this.createNodePath(slot.inspectorPath());
        pathNodes.forEach(node => {
            if (node !== this) {
                node.setNodeSubtitleIsChildrenSummary(true);
                node.setHasNewlineAferSummary(true)
                if (node !== pathNodes.last()) {
                    node.setHasNewLineSeparator(true);
                }
            }
        });

        /*
        const node = pathNodes.last()
        if (node !== this) {
            node.setNodeSubtitleIsChildrenSummary(true)
        }
        */

        if (slot.isIndirectSubnodeField()) {
            console.log("adding indirect field for slot " + slot.name());
            const indirectNode = BMSummaryNode.clone().setTitle(slot.label());
            indirectNode.addSubnode(field);
            indirectNode.setNodeFillsRemainingWidth(true);

            pathNodes.last().addSubnode(indirectNode);
        } else {
            //assert(slot.name() !== "completedPrompt");
            pathNodes.last().addSubnode(field);
        }
        return this
    }

}.initThisClass());




