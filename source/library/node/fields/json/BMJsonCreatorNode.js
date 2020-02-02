"use strict"

/*

    BMJsonCreatorNode
    

*/
        
window.BMJsonCreatorNode = class BMJsonCreatorNode extends BMStorableNode {
    
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
        this.setTitle("Choose JSON type")
    }

    prepareForFirstAccess () {
        this.setupSubnodes()
    }

    static fieldTypes () {
        return [
            "BMBooleanField", 
            //"BMDateNode", // BMDateAndTimeNode?
            "BMJsonArrayNode", // creator node is BMJsonCreatorNode "Choose Json type"
            "BMJsonDictionaryNode", 
            "BMJsonNullField",
            "BMNumberField", 
            "BMStringField",
        ]
    }

    visibleNameForTypeName (name) {
        name = name.sansPrefix("BM")
        name = name.sansSuffix("Field")
        name = name.sansSuffix("Node")
        name = name.sansPrefix("Json")
        return name
    }

    primitiveSubnodes () {
        const primitiveNodes = this.thisClass().fieldTypes().map((typeName) => {
            const name = this.visibleNameForTypeName(typeName)
            const newNode = BMMenuNode.clone()
            newNode.setTitle(name).setTarget(this).setMethodName("didChoose").setInfo(typeName)
            return newNode
        })

        return primitiveNodes
    }

    setupSubnodes () {
        this.addSubnodes(this.primitiveSubnodes())
        return this
    }

   didChoosePrototype (actionNode) {
        const proto = actionNode.info()
        const newNode = proto.duplicate()
        this.replaceNodeWith(newNode)
        return this
   }

    didChoose (actionNode) {
        assert(this.parentNode())
        const typeName = actionNode.info()
        this.createType(typeName)
        return this
    }

    replaceNodeWith (newNode) {
        const parentNode = this.parentNode()
        this.parentNode().replaceSubnodeWith(this, newNode)
        parentNode.postShouldFocusAndExpandSubnode(newNode) 
    }

    createType (typeName) {
        const proto = window[typeName]
        const newNode = proto.clone()

        if (newNode.setKeyIsEditable) {
            newNode.setKeyIsEditable(true)
            //newNode.setValueIsEditable(true)
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

    nodeSummary () {
        return ""
    }

    static jsonToProtoNameDict () {
        return {
            "Null" : "BMJsonNullField",
            "String" : "BMStringField",
            "Number" : "BMNumberField",
            //"Date" : "BMDateField",
            "Boolean" : "BMBooleanField",
            "Array" : "BMJsonArrayNode",
            "Object" : "BMJsonDictionaryNode"
        }
    }

    static acceptedDropTypes () {
        return Object.values(this.jsonToProtoNameDict())
    }

    static nodeForJson(json) {
        const t = Type.typeName(json)
        const protoName = this.jsonToProtoNameDict()[t]  
        if (protoName) {
            const proto = window[protoName]
            if (proto) {
                const instance = proto.clone().setJson(json)
                return instance
            }
        }

        return null
    }

    
}.initThisClass()
