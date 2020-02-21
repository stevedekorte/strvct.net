"use strict"

/*

    BMCreatorNode
    
    A stand-in node that let's the user select field to replace it with.

*/
        
window.BMCreatorNode = class BMCreatorNode extends BMStorableNode {
    
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
        this.setNoteIconName("right arrow")
        this.setTitle("Chose type")
    }

    prepareForFirstAccess () {
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
            "BMMenuNode", 
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

    primitiveClasses () {
        let classes = BMNode.allSubclasses()
        return classes.filter(aClass => aClass.availableAsPrimitive())
    }

    setupSubnodes () {
        if (this.subnodes().length == 0) {
            this.addSubnodes(this.primitiveSubnodes())
            //this.addSubnodes(this.protoSubnodes())
        }
        return this
    }

    primitiveSubnodes () {
        return this.primitiveClasses().map((aClass) => {
            const name = aClass.visibleClassName()
            const newNode = BMMenuNode.clone()
            newNode.setTitle(name)
            newNode.setNoteIconName(null)
            newNode.setTarget(this).setMethodName("didChoose").setInfo(aClass)
            newNode.setCanDelete(false)
            return newNode
        })
    }

    protoSubnodes () {
        const app = this.rootNode()
        const protosNode = app.firstSubnodeWithTitle("Prototypes")
        const protos = protosNode.subnodes()
        return protos.map((proto) => {
            const newNode = BMMenuNode.clone()
            newNode.setTitle(proto.title())
            newNode.setSubtitle(proto.subtitle())
            newNode.setNoteIconName(null)
            newNode.setTarget(this).setMethodName("didChoose").setInfo(proto)
            newNode.setCanDelete(false)
            return newNode
        })
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
        this.parentNode().replaceSubnodeWith(this, newNode)
        parentNode.postShouldFocusAndExpandSubnode(newNode) 
    }

    nodeSummary () {
        return ""
    }
    
}.initThisClass()
