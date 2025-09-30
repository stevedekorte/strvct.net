"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class JsonPatchRequest
* @extends UoJsonDictionaryNode
* @classdesc Describes a JSON patch.
*/

(class JsonPatchRequest extends UoJsonDictionaryNode {

    static jsonSchemaDescription () {
        return "JSON Patch is defined in RFC 6902 as a format for describing changes to a JSON document.";
    }

    static asJsonSchema () {
    // Don't include $schema when used as a definition within another schema
    // Simplified schema without if/then which may not be supported by z-schema
        return {
            "title": "JSON Patch",
            "type": "array",
            "items": {
                "type": "object",
                "required": ["op", "path"],
                "properties": {
                    "op": {
                        "type": "string",
                        "enum": ["add", "remove", "replace", "move", "copy", "test"]
                    },
                    "path": {
                        "type": "string",
                        "format": "json-pointer"
                    },
                    "value": {
                        "description": "The value to use for add, replace, and test operations"
                    },
                    "from": {
                        "type": "string",
                        "format": "json-pointer",
                        "description": "The source path for move and copy operations"
                    }
                },
                "additionalProperties": false
            }
        };
    }

    /**
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

    }

}.initThisClass());
