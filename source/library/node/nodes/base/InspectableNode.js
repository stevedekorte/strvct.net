"use strict";

/*

    InspectableNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Handles creating inspector nodes and related fields.
    Slot has some logic for this too.

*/

(class InspectableNode extends ActionableNode {

    initPrototype () {
        this.newSlot("nodeCanInspect", true).setDuplicateOp("copyValue")
        this.newSlot("nodeInspector", null)
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
        const slots = this.thisPrototype().allSlots()
        slots.ownForEachKV((name, slot) => {
            const field = slot.newInspectorField()
            if (field) {
                field.setTarget(this)
                const node = this.nodeInspector().createNodePath(slot.inspectorPath())
                node.addSubnode(field)
            }
        })
        return this
    }    

    // --- helpful for setting up inspector paths ---

    createNodePath (aPath, pathSubnodeType = "BMFolderNode") {
        let node = this

        if (!aPath) {
            return node
        }

        const components = aPath.split("/")
        components.forEach(component => {
            node = this.subnodeWithTitleIfAbsentInsertClosure(component, () => {
                const node = Object.getClassNamed(pathSubnodeType).clone()
                node.setTitle(component)
                return node
            })
        })

        return node
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
        
    nodeRowLink () {
        // used by UI row views to browse into next column
        return this
    }

    // nodeRowLinkMethods
    // used by UI row views to choose the node ref to use for the next column
    // if returns null, the row won't open another column
    // 
    // The two typical use cases are :
    //
    // 1) A pointer row which links to some other node.
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

    nodeRowLinkMethods () {
        return ["thisNode"]
    }

    defaultNodeRowLinkMethod () {

    }


}.initThisClass());




