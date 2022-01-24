"use strict";

/*

    BMJsonNode
    

*/
        
(class BMJsonNode extends BMStorableNode {
    
    static canOpenMimeType (mimeType) {
        return mimeType === "application/json"
    }

    static openMimeChunk (dataChunk) {
        const data = dataChunk.decodedData()
        //console.log("data = '" + data + "'")
        let json = null

        try {
            json = JSON.parse(data)
            //console.log("drop json = " + JSON.stringify(json, 2, 2) + "")
        } catch (error) {
            // return an error node instead?
        }

        const aNode = this.nodeForJson(json)
        return aNode
    }

    jsonClasses () {
        return [BMJsonArrayNode, BMBooleanField, BMJsonNullField, BMNumberField, BMJsonDictionaryNode, BMStringField]
    }
    

    static jsonToProtoNameDict () {
        return {
            "Array"   : "BMJsonArrayNode",
            "Boolean" : "BMBooleanField",
            "Null"    : "BMJsonNullField",
            "Number"  : "BMNumberField",
            "Object"  : "BMJsonDictionaryNode",
            "String"  : "BMStringField",
        }
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

    init () {
        super.init()
        this.setNodeCanEditTitle(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)
        this.setCanDelete(true)
        this.setNoteIconName("right arrow")

        this.addAction("add")
        this.setSubnodeClasses(this.jsonClasses())
        this.setTitle("JSON")
    }

    
}.initThisClass())
