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
            //"BMIdentityField", 
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
        ]
    }

    visibleNameForTypeName (name) {
        const aClass = window[name]
        return aClass.visibleClassName()
        /*
        name = name.sansPrefix("BM")
        name = name.sansSuffix("Field")
        name = name.sansSuffix("Node")
        return name
        */
    }

    primitiveSubnodes () {
        const nodes = this.thisClass().fieldTypes().map((typeName) => {
            const name = this.visibleNameForTypeName(typeName)
            const newNode = BMMenuNode.clone()
            newNode.setNoteIconName(null)
            newNode.setCanDelete(false)
            newNode.setTitle(name).setTarget(this).setMethodName("didChoosePrimitive").setInfo(typeName)
            return newNode
        })

        return nodes
    }

    protoSubnodes () {
        const app = this.rootNode()
        const protos = app.firstSubnodeWithTitle("Prototypes")
        const nodes = protos.subnodes().map((proto) => {
            const newNode = BMMenuNode.clone()
            newNode.setTitle(proto.title()).setSubtitle(proto.subtitle())
            newNode.setTarget(this).setMethodName("didChoosePrototype").setInfo(proto)
            newNode.setCanDelete(false)
            newNode.setNoteIconName("inner-checkbox")
            return newNode
        })
        return nodes
    }

    setupSubnodes () {
        this.addSubnodes(this.primitiveSubnodes())
        this.addSubnodes(this.protoSubnodes())
        return this
    }

   didChoosePrototype (actionNode) {
        const proto = actionNode.info()
        const newNode = proto.duplicate()
        this.replaceSelfWithNode(newNode)
        return this
   }

    didChoosePrimitive (actionNode) {
        const typeName = actionNode.info()
        this.createType(typeName)
        return this
    }

    createType (typeName) {
        if (this._didCreate) {
            throw new Error("attempt to call create twice!")
            return 
        } else {
            this._didCreate = true
        }

        assert(!Type.isNull(this.parentNode()))
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
