"use strict";

/*

    BMCreatorNode
    
    A stand-in node that let's the user select field to replace it with.

*/
        
(class BMCreatorNode extends BMStorableNode {
    
    initPrototype () {
        this.overrideSlot("subnodes").setShouldStoreSlot(false)
        this.newSlot("typeChoices", []).setInitProto(Array)
    }

    init () {
        super.init()
        this.setNodeCanEditTitle(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.setCanDelete(true)
        this.setNoteIconName("right-arrow")
        this.setTitle("Chose type")
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupSubnodes()
    }

    static fieldTypes () {
        return [
            "BMActionNode", 
            "BMBooleanField", 
            "BMDateNode",
            "BMImageWellField", 
            "BMJsonDictionaryNode",
            "BMJsonArrayNode",
            "BMFolderNode", 
            "BMNumberField", 
            "BMOptionsNode",
            "BMStringField",
            "BMTextAreaField",
            //"BMTextNode",
            "BMTimeNode",
            "BMLinkNode",
            "BMUrlField",
        ]
    }

    protoObjects () {
        const app = this.rootNode()
        const protosNode = app.firstSubnodeWithTitle("Prototypes")
        const protos = protosNode.subnodes()
        return protos
    }

    setupSubnodes () {
        if (this.subnodes().length == 0) {
            this.addSubnodesForObjects(BMNode.primitiveNodeClasses())
            //this.addSubnodesForObjects(this.protoObjects())
        }
        return this
    }
    
    addSubnodesForObjects (objects) {
        const newSubnodes = objects.map((aClass) => {
            const newNode = BMFolderNode.clone()
            newNode.setTitle(aClass.nodeCreateName())
            newNode.setNodeCanEditTitle(false)
            newNode.setNodeCanEditSubtitle(false)
            newNode.setNoteIconName(null)
            newNode.setTarget(this).setMethodName("didChoose").setInfo(aClass)
            newNode.setCanDelete(false)
            return newNode
        })
        this.addSubnodes(newSubnodes)
    }

   didChoose (actionNode) {
        const obj = actionNode.info()
        const newNode = obj.nodeCreate()
        newNode.setCanDelete(true)
        this.replaceSelfWithNode(newNode)
        return this
   }

    replaceSelfWithNode (newNode) {
        const parentNode = this.parentNode()
        assert(parentNode)
        parentNode.replaceSubnodeWith(this, newNode)
        parentNode.postShouldFocusAndExpandSubnode(newNode) 
    }

    nodeSummary () {
        return ""
    }
    
}.initThisClass());
