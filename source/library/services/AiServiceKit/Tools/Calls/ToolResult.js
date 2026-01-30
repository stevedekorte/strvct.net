"use strict";
/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolResult
* @extends SvJsonDictionaryNode
* @classdesc A specific response to a tool call.


 <tool-call-result>
  {
    "callId": string,        // e.g., "call_0", "call_1", etc.
    "result": object,        // The response data from the tool
    "status": string,        // Either "success" or "error"
    "error": string | null   // Error message if status="error", otherwise null
  }
  </tool-call-result>

*/

//UoJsonDictionaryNode
(class ToolResult extends SvSummaryNode {

    static enclosingTagName () {
        return "tool-call-result";
    }

    static jsonSchemaDescription () {
        return `Format for client to respond with a result a tool call. 
See schema for the particular tool call (whose name is in the toolName property) for the expected "result" property schema.`;
    }

    static toolCallResultJsonSchemaForToolDefinition (toolDefinition, refSet = new Set()) {
    // only the ToolCall class should know what it's schema is
        const schema = this.asJsonSchema(new Set()).deepCopy();
        const method = toolDefinition.toolMethod();
        const toolName = method.assistantToolName();

        schema["$id"] = toolName + "_ToolCallResult";
        schema.description = method.description();
        schema.properties.toolName = { "const": toolName };
        schema.properties.result = { "$ref": method.returnsJsonSchema(refSet) };
        return schema;
    }

    /**
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("toolCall", null);
            slot.setDescription("Reference to the tool call.");
            slot.setSlotType("ToolCall");
            slot.setShouldJsonArchive(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        // ---- BEGIN ToolResult JSON schema ----

        /*
    {
        const slot = this.overrideSlot("jsonId", null);
        slot.setIsInJsonSchema(false);
    }
    */

        {
            const slot = this.newSlot("toolName", "");
            slot.setDescription("The name of the tool that made the call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setIsSubnodeField(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("callId", "");
            slot.setDescription("A unique identifier included in the tool call to which this is a response.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setIsSubnodeField(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("status", null);
            slot.setDescription("A string describing the status of the call.");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setValidValues(["success", "failure"]);
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("result", null);
            slot.setDescription("A Json object containing the response to the tool call.");
            slot.setSlotType("JSON Object");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("error", null);
            slot.setDescription("An error message if the call failed.");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(false);
            slot.setShouldStoreSlot(true);
        }

        // ---- END ToolResult JSON schema ----

        {
            const slot = this.newSlot("extraMessage", null);
            slot.setInspectorPath("extraMessage");
            slot.setDescription("An extra message if the call failed. This is used to provide more information about the error.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setIsSubnodeField(true);
            slot.setShouldJsonArchive(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
            slot.setIsRequired(false);
        }

        {
            const slot = this.newSlot("copyExtraMessageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Copy Extra Message");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("copyExtraMessage");
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    title () {
        return "result";
    }

    subtitle () {
        return this.error();
    }

    composeResponseString () {
        const json = this.jsonArchive();
        let content = JSON.stableStringifyWithStdOptions(json, null, 2);
        //content = "![CDATA[${" + content + "]]>";
        const tagName = this.thisClass().enclosingTagName();
        content = `<${tagName}>` + content + `</${tagName}>`;
        return content;
    }

    hasError () {
        return this.error() !== null;
    }

    hasSuccess () {
        return this.status() === "success";
    }

    toolMethod () {
        const toolCall = this.toolCall();
        if (!toolCall) {
            throw new Error("Tool result has no associated tool call");
        }
        const toolDefinition = toolCall.findToolDefinition();
        if (toolDefinition === null) {
            toolCall.findToolDefinition();
            throw new Error(this.logPrefix() + ".toolMethod() - Tool definition not found for tool call: " + toolCall.toolName());
        }
        return toolDefinition.toolMethod();
    }

    isSilentSuccess () {
        return this.toolMethod().isSilentSuccess();
    }

    isSilentError () {
        return this.toolMethod().isSilentError();
    }

    doesRequireResponse () {
        if (this.hasSuccess()) {
            return !this.isSilentSuccess();
        }
        if (this.hasError()) {
            // For errors, check if we have a valid tool definition first
            // If not (e.g., JSON parse errors), always report the error
            const toolCall = this.toolCall();
            if (toolCall && toolCall.hasToolDefinition()) {
                return !this.isSilentError();
            } else {
                // No tool definition means this is likely a parse error
                // Always report these errors back to the AI
                return true;
            }
        }
        throw new Error("Invalid tool result status: " + this.status());
    }

    copyExtraMessage () {
        this.extraMessage().asyncCopyToClipboard();
    }

    // --- JSON Serialization for Cloud Sync ---

    /**
     * @description Serializes this ToolResult to JSON for cloud sync.
     * @param {String} filterName - The filter name (e.g., "Cloud")
     * @param {Array} pathComponents - Path components for error messages
     * @returns {Object} JSON representation
     * @category Serialization
     */
    serializeToJson (filterName, pathComponents = []) {
        return {
            _type: this.svType(),
            toolName: this.toolName(),
            callId: this.callId(),
            status: this.status(),
            result: this.result(),
            error: this.error()
        };
    }

    /**
     * @description Deserializes JSON data into this ToolResult.
     * @param {Object} json - The JSON data
     * @param {String} filterName - The filter name (e.g., "Cloud")
     * @param {Array} pathComponents - Path components for error messages
     * @returns {ToolResult} This instance
     * @category Serialization
     */
    deserializeFromJson (json, filterName, pathComponents = []) {
        if (json.toolName !== undefined) {
            this.setToolName(json.toolName);
        }
        if (json.callId !== undefined) {
            this.setCallId(json.callId);
        }
        if (json.status !== undefined) {
            this.setStatus(json.status);
        }
        if (json.result !== undefined) {
            this.setResult(json.result);
        }
        if (json.error !== undefined) {
            this.setError(json.error);
        }
        return this;
    }

}.initThisClass());
