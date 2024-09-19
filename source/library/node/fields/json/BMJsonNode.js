/**
 * @module library.node.fields.json.BMJsonNode
 */

"use strict";

/**
 * @class BMJsonNode
 * @extends BMJsonCachedNode
 * @classdesc Represents a JSON node in the application. This class handles JSON data and provides methods for parsing and creating nodes from JSON.
 */
(class BMJsonNode extends BMJsonCachedNode {
    
    /**
     * @static
     * @description Checks if the given MIME type can be opened by this class.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is "application/json", false otherwise.
     */
    static canOpenMimeType (mimeType) {
        return mimeType === "application/json"
    }

    /**
     * @static
     * @description Opens and parses a chunk of JSON data.
     * @param {Object} dataChunk - The data chunk containing JSON.
     * @returns {BMJsonNode|null} A node representing the parsed JSON, or null if parsing fails.
     */
    static openMimeChunk (dataChunk) {
        const data = dataChunk.decodedData()
        //console.log("data = '" + data + "'")
        let json = null

        try {
            json = JSON.parse(data)
            //console.log("drop json = " + JSON.stableStringify(json, 2, 2) + "")
        } catch (error) {
            // return an error node instead?
        }

        const aNode = this.nodeForJson(json)
        return aNode
    }

    /**
     * @description Returns an array of JSON-related classes.
     * @returns {Array} An array of classes used for handling different JSON data types.
     */
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

    /**
     * @static
     * @description Returns a dictionary mapping JSON types to their corresponding prototype names.
     * @returns {Object} A dictionary with JSON types as keys and prototype names as values.
     */
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
    
    /**
     * @static
     * @description Creates a node instance based on the given JSON data.
     * @param {*} json - The JSON data to create a node for.
     * @returns {BMJsonNode|null} A node instance representing the JSON data, or null if no matching prototype is found.
     */
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

    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default settings.
     */
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

    /**
     * @description Performs final initialization steps.
     */
    finalInit () {
        super.finalInit();
        if (this.subnodeClasses().length === 0) {
            this.setSubnodeClasses(this.jsonClasses());
        }
    }
    
}.initThisClass());