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

    initPrototypeSlots () {

        {
            // the json that this node represents
            // we update this when the node is edited
            // the node is the truth and the json is derived from it
            const slot = this.newSlot("jsonCache", null);
        }

        {
            // a hash of JSON.stableStrigify(jsonCache)
            const slot = this.newSlot("jsonHash", null);
        }
    }

    setJsonCache (json) {
        this._jsonCache = json;
        this.setJsonHash(JSON.stableStringify(json).hashCode());
        return this;
    }

    updateJsonCache () {
        //this.setJsonCache(null);
        this.setJsonCache(this.asJson());
        return this;
    }

    didUpdateNode () {
        super.didUpdateNode();
        this.updateJsonCache();
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
        this.setNodeCanAddSubnode(true);
    }

    finalInit () {
        super.finalInit();
        if (this.subnodeClasses().length === 0) {
            this.setSubnodeClasses(this.jsonClasses());
        }
        this.updateJsonCache();
    }

    doesMatchJson (json) {
        const b = JSON.stableStringify(this.asJson());
        if (this.jsonHash()) {
            return this.jsonHash() === b.hashCode();
        }
        const a = JSON.stableStringify(json); 
        return a === b;
    }
    
}.initThisClass());
