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
            "BMJsonDictionaryNode",
            "BMJsonArrayNode",
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
            const newNode = BMMenuNode.clone()
            newNode.setTitle(name).setTarget(this).setMethodName("didChoosePrimitive").setInfo(typeName)
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
            newNode.setTitle(sn.title()).setTarget(this).setMethodName("didChoosePrototype").setInfo(sn)
            return newNode
        })

        this.addSubnodes(newSubnodes)
        return this
    }

    /*
    onTapOfNode (aNode) {
        const typeName = aNode._createTypeName
        if (typeName) {
            this.createType(typeName)
        }
        return true
    }
    */

   didChoosePrototype (actionNode) {
        const proto = actionNode.info()
        const newNode = proto.duplicate()
        this.replaceNodeWith(newNode)
        return this
   }

    didChoosePrimitive (actionNode) {
        const typeName = actionNode.info()
        this.createType(typeName)
        return this
    }

    setParentNode (aNode) {
        if (Type.isNull(aNode)) {
            console.log(">>>>>>>>>>>>>>> " + this.debugTypeId() + ".setParentNode(null)")
        } else {
            console.log(">>>>>>>>>>>>>>> " + this.debugTypeId() + ".setParentNode(" + aNode.debugTypeId() + ")")
        }
        return super.setParentNode(aNode)
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

        this.replaceNodeWith(newNode)

        return this
    }

    replaceNodeWith (newNode) {
        const parentNode = this.parentNode()
        this.parentNode().replaceSubnodeWith(this, newNode)
        parentNode.postShouldFocusAndExpandSubnode(newNode) 
    }

    nodeSummary () {
        return ""
    }
    
}.initThisClass()
