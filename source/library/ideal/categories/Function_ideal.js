"use strict";

/** 
 * @module library.ideal
 * @class Function_ideal
 * @extends Function
 * @description Some extra methods for the Javascript Function primitive
*/

/*
(class Function_ideal extends Function {

    static isKindOf (superclass) {
        if (typeof superclass !== 'function') return false; // Ensure superclass is a valid constructor
    
        let current = this;
        while (current) {
            if (current === superclass) return true;
            current = Object.getPrototypeOf(current);
        }
        return false;
    }

}).initThisCategory();
*/

Function.isKindOf = function(superclass) {
    if (typeof superclass !== 'function') {
        return false;
    }

    let proto = this.prototype;
    while (proto) {
        if (proto === superclass.prototype) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
};

/*
Function.isKindOf = function(superclass) {
    if (typeof superclass !== 'function') {
        return false; // Ensure superclass is a valid constructor
    }

    let current = this;
    while (current) {
        if (current === superclass) {
            return true;
        }

        if (current.name === superclass.name) {
            // ran into case of Event instance class being a Function not the Event class
            // so we need to check the name
            return true;
        }

        if (current.constructor !== current) {
            current = current.constructor;
        } else {
            current = null;
        }
    }
    return false;
};
*/

    Function.prototype.isKindOf = function(superclass) {
        if (typeof superclass !== 'function') return false;
        let proto = this.prototype;
        while (proto) {
            if (proto === superclass.prototype) return true;
            proto = Object.getPrototypeOf(proto);
        }
        return false;
    };


    Function.prototype.setMetaProperty = function(key, value) {
        /* notes:  
            - common keys:
                - "parameters" (dictionary of parameter names and their JSON Schema
                - "returnType"
                - "description"
                - "examples"
                - "seeAlso"
                - "since"
                - "deprecated" (true/false)
                - "throws" (array of error objects in JSON Schema format)
        */
        this._meta ??= {};
        this._meta[key] = value;
        return this;
    };

    Function.prototype.getMetaProperty = function(key) {
        return this._meta?.[key];
    };

    // name

    Function.prototype.assistantToolName = function() {
        return this.name;
    };

    // description

    Function.prototype.setDescription = function(description) {
        this.setMetaProperty("description", description);
        return this;
    };

    Function.prototype.description = function() {
        return this.getMetaProperty("description");
    };

    // parameters

    Function.prototype.setParameters = function(dict) {
        this.setMetaProperty("parameters", dict);
        return this;
    };

    Function.prototype.parameters = function() {
        const parameters = this.getMetaProperty("parameters");
        if (!parameters) {
            this.setParameters({});
        }
        return this.getMetaProperty("parameters");
    };

    // add parameter

    Function.prototype.addParameter = function(name, type, description) {
        assert(name, "Name is required");
        assert(type, "Type is required");
        if (!name.isCapitalized()) {
            assert(description, "Description is required");
        }

        this.parameters()[name] = { 
            "type": type, 
            "description": description // description will not be used if the type is a class (and not a basic JSON type)
        };

        return this;
    };

    Function.prototype.parametersCallDescription = function() {
        const parameters = this.parameters();
        let parts = [];
        Object.keys(parameters).map(key => {
            const param = parameters[key];
            parts.push(param.type + " " + key);
        });
        return "(" + parts.join(", ") + ")";
    };

    // return type

    Function.prototype.setReturnTypes = function(types) {
        this.setMetaProperty("returnTypes", types);
        return this;
    };

    Function.prototype.returnTypes = function() {
        return this.getMetaProperty("returnTypes");
    };

    // Tool Call Response Policy - how to handle the tool call response 
    // (silent success, silent error, or visible to user)

    // silent success

    Function.prototype.setSilentSuccess = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setMetaProperty("silentSuccess", aBool);
        return this;
    };

    Function.prototype.silentSuccess = function() {
        return this.getMetaProperty("silentSuccess") !== false;
    };

    // silent error

    Function.prototype.setSilentError = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setMetaProperty("silentError", aBool);
        return this;
    };

    Function.prototype.silentError = function() {
        return this.getMetaProperty("silentError") == true;
    };

    // json schema for tool call use

    Function.prototype.jsonSchemaForParameter = function(parameter, refSet) {
        assert(refSet, "refSet is required");
        if (parameter.type.isCapitalized()) {
            const aClass = getGlobalThis()[parameter.type];
            return aClass.jsonSchemaRef(refSet);
        }
        return { 
            "type": parameter.type, 
            "description": parameter.description 
        };
    };

    Function.prototype.returnsJsonSchema = function(refSet) {
        assert(refSet, "refSet is required");

        const oneOf = [];
        
        this.returnTypes().forEach(type => {
            if (type.isCapitalized()) {
                const aClass = getGlobalThis()[type];
                //refSet.add(aClass); // needed or added by jsonSchemaRef
                oneOf.push(aClass.jsonSchemaRef(refSet));
            } else {
                oneOf.push({ 
                    "type": type 
                });
            }
        });

        if (oneOf.length === 0) {
            return null;
        }

        if (oneOf.length === 1) {
            return oneOf[0];
        }

        return {
            "oneOf": oneOf
        };
    };

  /*

    Example:

      {
    "toolName": "getWeather",
    "description": "Retrieve the current weather for a specific location.",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city or place to get the weather for."
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"],
          "description": "Temperature unit to use for the result."
        }
      },
      "required": ["location"]
    }
      "returns": {
        "$ref": "#/components/schemas/Weather"
      }
  },
*/
    Function.prototype.toolSpecJson = function(refSet = new Set()) {
        const name = this.assistantToolName();

        assert(name, "Assistant tool name is required");

        const description = this.description();
        assert(description, "Assistant tool description is required");

        const parameters = this.parameters();
        assert(parameters, "Assistant tool parameters are required");

        // need to ref types to put them in refSet

        const paramsSchema = {
            // keys and $ref and description
        };

        const refTypeName = function (typeName, refSet) {
            assert(refSet);
            const aClass = getGlobalThis()[typeName];
            assert(aClass,  "missing referenced class '" + typeName + "'");
            return aClass.jsonSchemaRef(refSet);
        };

        // add parameter refs
        Object.keys(parameters).forEach(key => {
            const paramDict = parameters[key];
            const dict = {};
            paramsSchema[key] = dict;
            const isJsonType = ["null", "array", "string", "object"].includes(paramDict.type);
            if (isJsonType) {
                dict["type"] = paramDict.type;
            } else {
                dict["$ref"] = refTypeName(paramDict.type, refSet);
            }
            dict.description = paramDict.description;
        });

        /*
        // add return type refs
        this.returnTypes().forEach(typeName => {
            refTypeName(paramDict.type, refSet);
        });
        */

        return {
            "toolName": name,
            "description": description,
            "parameters": paramsSchema,
            "returns": this.returnsJsonSchema(refSet),
            "silentSuccess": this.silentSuccess(),
            "silentError": this.silentError()
        };
    }

    Function.prototype.toolSpecPrompt = function() {
        const json = this.toolSpecJson();
        return JSON.stringify(json, null, 2);
    };

    // isToolable

    Function.prototype.setIsToolable = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setMetaProperty("isToolable", aBool);
        if (this.toolTiming() === null) {
            // set a default
            this.setToolTiming("on completion");
        }
        return this;
    };

    Function.prototype.isToolable = function() {
        return this.getMetaProperty("isToolable") == true;
    };

    // Tool Call Timing - when to make the tool call (on stream, on completion, on narration)

    Function.prototype.setToolTiming = function(timing) {
        const validTimings = ["on stream", "on completion", "on narration"];
        assert(validTimings.includes(timing), "Invalid timing: " + timing);
        this.setMetaProperty("toolTiming", timing);
        return this;
    };

    Function.prototype.toolTiming = function() {
        const value = this.getMetaProperty("toolTiming");
        if (value) {
            return value;
        }
        return "on completion";
    };

    // on completion 

    Function.prototype.setCallsOnCompletionTool = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setToolTiming("on completion");
        return this;
    };

    Function.prototype.callsOnCompletionTool = function() {
        return this.toolTiming() == "on completion";
    };

    // on stream

    Function.prototype.setCallsOnStreamTool = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setToolTiming("on stream");
        return this;
    };

    Function.prototype.callsOnStreamTool = function() {
        return this.toolTiming() == "on stream";
    };

    // on narration

    Function.prototype.setCallsOnNarrationTool = function(aBool) {
        assert(Type.isBoolean(aBool));
        this.setToolTiming("on narration");
        return this;
    };

    Function.prototype.callsOnNarrationTool = function() {
        return this.toolTiming() == "on narration";
    };


