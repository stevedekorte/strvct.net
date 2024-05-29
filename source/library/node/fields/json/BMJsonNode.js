"use strict";

/*

    BMJsonNode
    

*/
        
(class BMJsonNode extends BMSummaryNode {
    
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
        return [
            BMJsonArrayNode, 
            BMBooleanField, 
            BMJsonNullField, 
            BMNumberField, 
            BMJsonDictionaryNode, 
            BMStringField
        ];
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
            const proto = Object.getClassNamed(protoName)
            if (proto) {
                const instance = proto.clone().setJson(json)
                return instance
            }
        }

        return null
    }

    initPrototype () {
        //this.setSubnodeClasses(this.jsonClasses());
        this.setNodeCanEditTitle(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
        this.setCanDelete(true);
        this.setNoteIconName("right-arrow");
        this.setTitle("JSON");
    }

    init () {
        super.init();
        this.setCanAdd(true);
    }

    finalInit () {
        super.finalInit();
        if (this.subnodeClasses().length === 0) {
            this.setSubnodeClasses(this.jsonClasses());
        }
    }

    
}.initThisClass());
