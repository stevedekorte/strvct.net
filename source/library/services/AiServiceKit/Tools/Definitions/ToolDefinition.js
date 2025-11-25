"use strict";

/*
* @module library.services.AiServiceKit.Tools.Definitions
* @class ToolDefinition
* @extends SvJsonDictionaryNode
* @classdesc Describes what a tool can do.

*/

(class ToolDefinition extends UoJsonDictionaryNode {

    static jsonSchemaDescription () {
        return "Format for Assistant API call to make an '" + this.svType() + "' API call.";
    }

    /**
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("toolTarget", null);
            slot.setDescription("Instance of the class whose instance the tool call will be made on.");
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setIsRequired(false);
            slot.setShouldStoreSlot(true);
        }

        // --- begin json schema ----

        {
            const slot = this.newSlot("name", "");
            slot.setDescription("Name of the tool call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);
        }

        /*
    {
      const slot = this.newSlot("parameters", {}); // only defined for json schema - pass through to method info
      slot.setDescription("Parameters for the tool call.");
      slot.setSlotType("JSON Object");
      slot.setAllowsNullValue(false);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(true);
    }

    {
      const slot = this.newSlot("returns", {}); // only defined for json schema - pass through to method info
      slot.setDescription("Returns for the function to call.");
      slot.setSlotType("JSON Object");
      slot.setAllowsNullValue(false);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(true);
    }

    {
      const slot = this.newSlot("isSilentError", false); // only used for json schema
      slot.setDescription("Silent error for the function to call.");
      slot.setSlotType("Boolean");
      slot.setAllowsNullValue(false);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(false);
    }

    {
      const slot = this.newSlot("isSilentSuccess", false); // only used for json schema
      slot.setDescription("Silent success for the function to call.");
      slot.setSlotType("Boolean");
      slot.setAllowsNullValue(false);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(false);
    }
      */

        // --- end json schema ----

        {
            const slot = this.newSlot("jsonSchemaString", null);
            slot.setLabel("JSON Schema");
            slot.setDescription("JSON Schema for the function to call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);

        }

        {
            const slot = this.newSlot("referencedSchemas", null);
            slot.setInspectorPath("Referenced Schemas");
            slot.setKeyIsVisible(false);
            //slot.setLabel("completed prompt");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnodeField(true);
            slot.setSyncsToView(true);
            slot.setSlotType("SvSummaryNode"); // the node contains the component nodes
            slot.setCanEditInspection(false);
            slot.setFinalInitProto(SvSummaryNode);
            //slot.setValidValues(values);
        }

        {
            const slot = this.newSlot("jsonSchemaValidator", null);
            slot.setDescription("Validator for the JSON Schema.");
            //slot.setFinalInitProto(AjvValidator); // let's lazy instantiate this
            slot.setSlotType("AjvValidator");
            slot.setShouldStoreSlot(false);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(false);
        this.setNodeCanAddSubnode(false);
        /*
        this.setSummaryFormat("value");
        this.setHasNewlineAfterSummary(true);
        */
    }

    jsonSchemaValidator () {
        if (!this._jsonSchemaValidator) {

            this._jsonSchemaValidator = new AjvValidator();
        }
        return this._jsonSchemaValidator;
    }

    title () {
        let title = "";
        /*
        if (this.toolTarget()) {
        title += this.toolTarget().thisClass().svType() + ".";
        } else {
        title += "NULL";
        }
        */
        title += this.name();
        return title;
    }

    subtitle () {
        return this.toolMethod().description();
    }

    toolMethod () {
        //const method = this.toolTarget().methodNamed(this.name());

        // we may need to follow the prototype chain to find the method with the tool info on it
        // we check func.isToolable() to see if the method is toolable

        const slotName = this.name();
        const protoChain = this.toolTarget().prototypeChain();

        const method = protoChain.detectAndReturnValue(proto => {
            const method = proto[slotName];
            if (method && Type.isFunction(method) && method.isToolable()) {
                return method;
            }
            return false;
        });
        if (!method) {
            throw new Error("Method named '" + slotName + "' not found in class " + this.toolTarget().svType());
        }
        return method;
    }

    assertMethodExists () {
        const method = this.toolMethod();
        assert(method, "Method named " + this.name() + " not found in class " + this.toolTarget().svType());
    }

    // --- begin pass through to method info ---

    /*
  isSilentError () {
    const method = this.toolMethod();
    if (!method) {
      return null;
    }
    return method.isSilentError();
  }

  isSilentSuccess () {
    const method = this.toolMethod();
    if (!method) {
      return null;
    }
    return method.isSilentSuccess();
  }

  returns () {
    const method = this.toolMethod();
    if (!method) {
      return null;
    }
    return method.returns();
  }
 */

    // --- end pass through to method info ---

    /*
  toolJsonDescription (refSet = new Set()) { // tool definition info
    this.assertMethodExists();

    // Validate using the complete schema with definitions
    this.assertMethodHasValidJsonSchema();

    const method = this.toolMethod();
    // Return just the tool metadata (without definitions) for the prompt
    // The definitions will be provided elsewhere in the shared context
    //const metadata = this.toolMethod().asToolMetadata(refSet);
    //return metadata;

    const schema = {
        "$id": method.assistantToolName() + "_ToolDefinition",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "toolName": method.assistantToolName(),
        "description": method.description(),
        "toolCallSchema": ToolCall.toolCallJsonSchemaForToolDefinition(this, refSet),
        "toolCallResultSchema": ToolResult.toolCallResultJsonSchemaForToolDefinition(this, refSet),
        "behaviorNotes": {
          "isSilentSuccess": method.isSilentSuccess(),
          "isSilentError": method.isSilentError()
        }
    };
    console.log(this.logPrefix(), "schema: ", JSON.stringify(schema, null, 2));
    return schema;
  }
    */

    toolJsonDescription (refSet = new Set()) { // tool definition info
        this.assertMethodExists();

        // Validate using the complete schema with definitions
        this.assertMethodHasValidJsonSchema();

        const method = this.toolMethod();
        // Return just the tool metadata (without definitions) for the prompt
        // The definitions will be provided elsewhere in the shared context
        //const metadata = this.toolMethod().asToolMetadata(refSet);
        //return metadata;

        const schema = {
            "toolName": method.assistantToolName(),
            "description": method.description(),
            "toolCallSchema": ToolCall.toolCallJsonSchemaForToolDefinition(this, refSet),
            "toolCallResultSchema": ToolResult.toolCallResultJsonSchemaForToolDefinition(this, refSet),
            "behaviorNotes": {
                "isSilentSuccess": method.isSilentSuccess(),
                "isSilentError": method.isSilentError()
            }
        };
        //console.log(this.logPrefix(), "schema: ", JSON.stringify(schema, null, 2));
        return schema;
    }

    assertMethodHasValidJsonSchema () {
        const rootSchema = this.toolMethod().asRootJsonSchema();
        const validator = this.jsonSchemaValidator();

        try {
            validator.setJsonSchema(rootSchema);
        } catch (err) {
            console.error(this.logPrefix(), "Error validating schema for tool:", this.name());
            console.error(this.logPrefix(), "Error message:", err.message);
            console.error(this.logPrefix(), "Schema that failed:", JSON.stringify(rootSchema, null, 2));
            throw err;
        }

        if (validator.hasError()) {
            const e = new Error(validator.errorMessageForLLM());
            console.error(this.logPrefix(), "Tool definition JSON Schema is invalid: " + e.message);
            console.error(this.logPrefix(), "Schema that failed:", JSON.stringify(rootSchema, null, 2));
            throw e;
        }
    }


    updateJsonSchemaString () {
        const json = this.toolJsonDescription();
        const s = JSON.stableStringifyWithStdOptions(json, null, 2);
        this.setJsonSchemaString(s);
        this.setupComponents();
        return this;
    }

    classSetReferencedByDefinition () {
        const refSet = new Set();
        this.toolJsonDescription(refSet);
        return refSet;
    }

    // setup components -- this is just for the UI inspector of the tool definition schema

    componentsRoot () {
        return this.referencedSchemas();
    }

    addPathComponent (name, value) {
        const pathNodes = this.componentsRoot().createNodePath(name);
        const node = SvStringField.clone().setTitle(name).setValue(value);
        node.setKeyIsVisible(false);
        pathNodes.last().setNodeFillsRemainingWidth(true);
        pathNodes.last().addSubnode(node);
    }

    setupComponents () {
        const map = new Map();

        const refSet = new Set();
        Array.from(this.classSetReferencedByDefinition()).forEach(c => {
            map.set(c.svType(), c.asJsonSchema(refSet));
        });

        // components
        this.componentsRoot().setTitle("referenced schemas");
        this.componentsRoot().removeAllSubnodes();
        map.forEach((value, key) => {
            if (value === null) {
                console.warn(this.logPrefix(), "value is null for key: ", key, " using empty string instead");
                value = "";
            }

            if (!Type.isString(value)) {
                value = JSON.stringify(value, null, 2);
            }

            if (!Type.isString(key)) {
                console.warn(this.logPrefix(), "key: ", key);
                console.warn(this.logPrefix(), "value: ", value);
                throw new Error("key is not a string");
            }
            assert(Type.isString(key));
            assert(Type.isString(value));
            this.addPathComponent(key, value);
        });
    }

    description () {
    //return this.toolMethod().name();
        return "- " + this.name();
    }

}.initThisClass());
