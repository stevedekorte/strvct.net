"use strict"

/*

    BMCreatorNode
    
    A stand-in node that let's the user select field to replace it with.

*/
        
window.BMCreatorNode = class BMCreatorNode extends BMStorableNode {
    
    initPrototype () {
        this.overrideSlot("subnodes").setShouldStoreSlot(false)
    }

    init () {
        super.init()
        this.setNodeCanEditTitle(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.scheduleSelfFor("setupSubnodes", 0)
        this.setCanDelete(true)
    }

    title () {
        return "Choose type"
    }

    /*
    acceptsSubnodesOfTypes () {
        return this.fieldTypes()
    }
    */

    static fieldTypes () {
        return [
            "BMActionNode", 
            "BMBooleanField", 
            //"BMDateField", 
            "BMDateNode",
            //"BMIdentityField", 
            "BMImageWellField", 
            "BMMenuNode", 
            "BMNumberField", 
            "BMOptionsNode",
            "BMStringField",
            "BMTextAreaField",
            "BMTextNode",
            "BMTimeNode",
            "BMLinkNode",
        ]
    }

    visibleNameForTypeName (name) {
        name = name.sansPrefix("BM")
        name = name.sansSuffix("Field")
        name = name.sansSuffix("Node")
        return name
    }

    primitiveSubnodes () {
        const primitiveNodes = this.thisClass().fieldTypes().map((typeName) => {
            const name = this.visibleNameForTypeName(typeName)
            //const newNode = BMActionNode.clone()
            const newNode = BMActionNode.clone()
            newNode.setTitle(name).setTarget(this).setMethodName("didChoose").setInfo(typeName)

            /*
            const newNode = BMNode.clone()
            newNode.setTitle(name) //.setActionTarget(this).setAction("didChoose")
            newNode._createTypeName = typeName
            */
            return newNode
        })

        return primitiveNodes
    }

    setupSubnodes () {
        this.addSubnodes(this.primitiveSubnodes())
        
        const app = this.rootNode()
        const protos = app.firstSubnodeWithTitle("Prototypes")
        const newSubnodes = protos.subnodes().map((sn) => {
            const newNode = BMActionNode.clone()
            newNode.setTitle(sn.title()).setTarget(this).setMethodName("didChooseSubnode").setInfo(sn)
            return newNode
        })

        newSubnodes.push(BMLinkNode.clone())
        this.addSubnodes(newSubnodes)

        return this
    }

    /*
    onRequestSelectionOfDecendantNode (aNode) {
        const typeName = aNode._createTypeName
        if (typeName) {
            this.createType(typeName)
        }
        return true
    }
    */

   didChooseSubnode (actionNode) {
        const proto = actionNode.info()
        const newNode = proto.duplicate()
        this.parentNode().replaceSubnodeWith(this, newNode)
        return this
   }

    didChoose (actionNode) {
        const typeName = actionNode.info()
        this.createType(typeName)
        return this
    }

    createType (typeName) {
        const proto = window[typeName]
        const newNode = proto.clone()

        if (newNode.setKeyIsEditable) {
            newNode.setKeyIsEditable(true)
            newNode.setValueIsEditable(true)
        }

        if (newNode.setIsEditable) {
            newNode.setIsEditable(true)
        }

        newNode.setCanDelete(true)
        newNode.setNodeCanInspect(true)
        newNode.setNodeCanEditTitle(true)

        this.parentNode().replaceSubnodeWith(this, newNode)

        return this
    }

    noteIconName () {
        return "single right caret"
    }

    nodeSummary () {
        return ""
    }
    
}.initThisClass()
