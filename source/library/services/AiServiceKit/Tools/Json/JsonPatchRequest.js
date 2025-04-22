"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class JsonPatchRequest
* @extends HwJsonDictionaryNode
* @classdesc Describes a JSON patch.
*/

(class JsonPatchRequest extends HwJsonDictionaryNode {

  static jsonSchemaDescription () {
    return "JSON Patch is defined in RFC 6902 as a format for describing changes to a JSON document.";
  }

  static asJsonSchema () {
    return {
      "$schema": "http://json-schema.org/draft-04/schema#",
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
            "description": "Required for add, replace, and test operations"
          },
          "from": {
            "type": "string",
            "format": "json-pointer",
            "description": "Required for move and copy operations"
          }
        },
        "allOf": [
          {
            "if": {
              "properties": { "op": { "enum": ["add", "replace", "test"] } }
            },
            "then": { "required": ["value"] }
          },
          {
            "if": {
              "properties": { "op": { "enum": ["move", "copy"] } }
            },
            "then": { "required": ["from"] }
          }
        ]
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