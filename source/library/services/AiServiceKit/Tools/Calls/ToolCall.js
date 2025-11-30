"use strict";

/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolCall
* @extends SvJsonDictionaryNode
* @classdesc A specific tool invocation.

Example Tool call format:

<tool-call>
{
  "toolName": "<tool_name>",
  "parameters": {
    ... // key-value pairs specific to the tool
  {
    "toolName": "getWeather",
    "parameters": {
      "location": "San Francisco",
      "unit": "celsius"
    }
  }
</tool-call>

*/

(class ToolCall extends UoJsonDictionaryNode {

    static jsonSchemaDescription () {
        return `Generic format for Assistant API call to make an '" + this.svType() + "' tool call.
    See schema for the particular tool call (whose name is in the toolName property) for the expected "parameters" property schema.`;
    }

    static toolCallJsonSchemaForToolDefinition (toolDefinition, refSet = new Set()) {
    // only the ToolCall class should know what it's schema is
    //const schema = this.asRootJsonSchema(new Set()).deepCopy();
        const schema = this.asJsonSchema(new Set()).deepCopy();

        const method = toolDefinition.toolMethod();
        const toolName = method.assistantToolName();

        schema["$id"] = toolName + "_ToolCall";
        schema.description = method.description();
        schema.properties.toolName = { "const": toolName };
        schema.properties.parameters = method.paramsSchema(refSet);
        return schema;
    }

    /**
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.overrideSlot("jsonId", null);
            slot.setIsInJsonSchema(false);
        }

        {
            const slot = this.newSlot("toolCalls", null);
            slot.setDescription("Reference to the owner ToolCalls instance.");
            slot.setSlotType("ToolCalls");
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("toolDefinition", null);
            slot.setDescription("Reference to the tool definition.");
            slot.setSlotType("ToolDefinition");
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("message", null);
            slot.setDescription("The message in the conversation in which the tool call was made."); // we should notify this of call completion/erros
            slot.setSlotType("AiResponseMessage");
            slot.setIsInJsonSchema(false);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setShouldStoreSlot(true);
        }

        // ---- BEGIN ToolCall JSON schema ----

        {
            const slot = this.newSlot("toolName", null); // set by tool call
            slot.setDescription("The name of the tool to call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("callId", null); // set by tool call
            slot.setDescription("A unique identifier for the call. The response will be tagged with this id.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(true);
            slot.setShouldStoreSlot(true);

            slot.setJsonSchemaPattern("^call_\\d+$");
        }

        // --- begin pass through JSON schema to method info ---

        {
            const slot = this.newSlot("parameters", {}); // pass through to method info
            slot.setDescription("JSON object of key/value parameters for the tool call.");
            slot.setSlotType("Object");
            slot.setAllowsNullValue(false);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(false);
        }

        {
            const slot = this.newSlot("toolNote", ""); // pass through to method info
            slot.setDescription("A note about the tool call which might contain info related to errors or retries. Purely for debugging purposes.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setIsInJsonSchema(true);
            slot.setIsRequired(false);
        }

        /*
    {
        const slot = this.newSlot("refCallId", ""); // pass through to method info
        slot.setDescription("A callId of a tool call which this call is a retry of. Only set if this call is a retry.");
        slot.setSlotType("String");
        slot.setAllowsNullValue(false);
        slot.setIsInJsonSchema(true);
        slot.setIsRequired(false);
    }
        */

        // --- end pass through JSON schema to method info ---

        {
            const slot = this.newSlot("status", "queued");
            slot.setDescription("The status of the call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
            slot.setValidValues(["queued", "calling", "completed"]);
            // queued: tool is queued to be called
            // calling: tool is waiting for a setResult() call from the receiver of the tool call
            // completed: set once setResult() is called
        }

        // ---- END ToolCall JSON schema ----

        {
            const slot = this.newSlot("callString", null); // do this at the string level in case there is a parse error and we need to ask for a correction
            slot.setInspectorPath("callString");
            slot.setDescription("JSON string for the call.");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("callJson", null); // do this at the string level in case there is a parse error and we need to ask for a correction
            slot.setDescription("JSON for the call.");
            slot.setSlotType("JSON Object");
            slot.setAllowsNullValue(true);
            slot.setShouldJsonArchive(true);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("toolResult", null);
            slot.setDescription("A ToolResult instance.");
            slot.setSlotType("ToolResult"); // subclasses should override this a needed
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        /*
        {
            const slot = this.newSlot("doesWaitForMessageCompletion", false);
            slot.setDescription("If true, the tool call will wait for the message complete notification before returning.");
            slot.setSlotType("Boolean");
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }
        */


        {
            const slot = this.newSlot("makeCallAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Make Call");
            slot.setIsSubnodeField(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setCanInspect(true);
            slot.setActionMethodName("makeCall");
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

    doesWaitForMessageCompletion () {
        return this.toolDefinition().doesWaitForMessageCompletion();
    }

    toolDefinitionForToolName (toolName) {
        const toolCalls = this.toolCalls();
        if (!toolCalls) {
            const msg = "Tool call '" + this.toolName() + "' has a toolCalls slot that is null";
            console.error(msg);
            debugger;
            throw new Error(msg);
        }
        return toolCalls.toolDefinitionWithName(toolName);
    }

    findToolDefinition () {
        if (this.toolDefinition() === null) {
            const def = this.toolDefinitionForToolName(this.toolName());
            this.setToolDefinition(def);
        }
        return this.toolDefinition();
    }

    isQueued () {
        return this.status() === "queued";
    }

    isCalling () {
        return this.status() === "calling";
    }

    isCompleted () {
        return this.status() === "completed";
    }

    title () {
        return this.toolName();
    }

    subtitle () {
        return this.callId() + "\n" + this.status();
    }

    handleCallString (callString) {
        this.setCallString(callString);
        if (callString !== null) {
            this.parseCallString();
        }
    }

    parseCallString () {
        try {
            let callString = this.callString();

            if (!callString.isValidJson()) {
                console.error("Error parsing tool call. Attempting to fix with BasicJsonRepairShop.");

                const repairShop = new BasicJsonRepairShop();
                repairShop.setJsonString(callString);
                repairShop.setLogEnabled(true);
                repairShop.repair();

                if (!repairShop.isValid()) {
                    repairShop.setJsonString(callString); // so we get the error on the original string?
                    repairShop.repair();

                    repairShop.setJsonString(callString); // so we get the error on the original string?

                    const errorString = repairShop.errorString();
                    const error = new Error(errorString);
                    this.handleParseError(error);
                    return;
                }

                callString = repairShop.jsonString();
                this.setCallString(callString); // so we don't have to fix it again
            }

            const json = JSON.parse(callString);
            this.setCallJson(json);

            assert(this.callJson().toolName, "toolName is required");
            assert(Type.isString(this.callJson().toolName), "toolName must be a string");

            assert(this.callJson().callId, "callId is required");
            assert(Type.isString(this.callJson().callId), "callId must be a string");

        } catch (e) {
            this.handleParseError(e);
        }
    }

    didUpdateSlotCallJson (oldValue, newValue) {

        if (oldValue !== this.callJson() && newValue !== null) {
            this.setToolName(newValue.toolName);
            this.setCallId(newValue.callId);
        }
    }

    assertValidCall () {
        this.assertValidToolCallSchema();
        // this.assertValidParametersSchema();
    }

    descriptionForSchemaValidationError (errorString) {
        const callSchema = ToolCall.toolCallJsonSchemaForToolDefinition(this.toolDefinition());

        const parts = [];
        parts.push("--------------------------------");
        parts.push("Error during schema validation:");
        parts.push(errorString);
        parts.push("--------------------------------");
        parts.push("Call schema:");
        parts.push(JSON.stringify(callSchema, null, 2));
        parts.push("--------------------------------");
        return parts.join("\n");
    }

    descriptionForJsonValidationError (errorString) {
        const callSchema = ToolCall.toolCallJsonSchemaForToolDefinition(this.toolDefinition());
        const callJson = this.callJson();

        const parts = [];
        parts.push("Error during schema validation:");
        parts.push(errorString);
        parts.push("--------------------------------");
        parts.push("Call schema:");
        parts.push(JSON.stringify(callSchema, null, 2));
        parts.push("--------------------------------");
        parts.push("Call JSON:");
        parts.push(JSON.stringify(callJson, null, 2));
        parts.push("--------------------------------");
        return parts.join("\n");
    }

    assertValidToolCallSchema () {
        const validator = new AjvValidator();

        // Use asRootJsonSchema from the Function class which already builds a complete schema with definitions
        const refSet = new Set();
        const callSchema = ToolCall.toolCallJsonSchemaForToolDefinition(this.toolDefinition(), refSet);
        const definitions = this.definitionsForRefSet(refSet);
        if (Type.isUndefined(callSchema.definitions)) {
            callSchema.definitions = {};
        }
        Object.assign(callSchema.definitions, definitions);

        validator.setJsonSchema(callSchema);

        // See if our own ToolCall schema is valid
        if (validator.hasError()) {
        // UH OH: our own Schema is invalid - this is not an LLM error
            const errorString = validator.errorMessageForLLM();
            const description = this.descriptionForSchemaValidationError(errorString);
            console.error(this.logPrefix(), description);
            const e = new Error(errorString);
            throw e;
        }

        // Now see if the call JSON is is valid against our own ToolCall schema
        const isValid = validator.validate(this.callJson());
        if (!isValid) {
            const errorString = validator.errorMessageForLLM();
            const description = this.descriptionForJsonValidationError(errorString);
            console.error(this.logPrefix(), description);
            const e = new Error(errorString);
            this.handleCallError(e);
        }

    }

    definitionsForRefSet (refSet) {
        const definitions = {};
        const fullRefSet = new Set(refSet);

        while (refSet.size > 0) {
            const newRefSet = new Set();
            for (const referencedClass of refSet) {
                const typeName = referencedClass.svType();
                const typeSchema = referencedClass.asJsonSchema(newRefSet);
                definitions[typeName] = typeSchema;
            }
            refSet = newRefSet.difference(fullRefSet); // only the items in newRefSet that are not in fullRefSet
            fullRefSet.addAll(newRefSet);
        }
        return definitions;
    }

    /*
  assertValidParametersSchema () {
    const validator = new AjvValidator();
    const refSet = new Set();
    const paramsSchema = this.toolDefinition().toolMethod().paramsSchema(refSet);

    // Build a complete schema with definitions for any referenced types
    const completeSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": paramsSchema,
      "additionalProperties": false
    };

    // Only add definitions if there are referenced types
    if (refSet.size > 0) {
      completeSchema.definitions = {};
      for (const referencedClass of refSet) {
        const typeName = referencedClass.svType();
        const typeSchema = referencedClass.asJsonSchema(new Set());
        completeSchema.definitions[typeName] = typeSchema;
      }
    }

    validator.setJsonSchema(completeSchema);
    const isValid = validator.validate(this.parametersDict());
    if (!isValid) {
        const errorString = validator.errorMessageForLLM();
        console.error("Error during schema validation:", errorString);
        console.error("Complete schema:", JSON.stringify(completeSchema, null, 2));
        console.error("Parameters JSON:", JSON.stringify(this.parametersDict(), null, 2));
        const e = new Error(errorString);
        this.handleCallError(e);
    }
  }
 */

    handleParseError (e) {
    //throw new Error(this.svType() + " Error parsing call string: " + e.message);

        // we need the callId to report the error - let's try to extract it
        const jsonRepairShop = new JsonRepairShop();
        jsonRepairShop.setJsonString(this.callString());
        const callId = jsonRepairShop.extractProperty("callId");

        if (callId !== undefined) {
            this.setCallId(callId);
        } else {
            console.warn("Failed to extract callId after parse error from call string: " + this.callString());
        }

        const toolName = jsonRepairShop.extractProperty("toolName");
        if (toolName !== undefined) {
            this.setToolName(toolName);
        } else {
            console.warn("Failed to extract toolName after parse error from call string: " + this.callString());
        }

        if (callId === undefined || toolName === undefined) {
            console.warn("Failed to extract callId or toolName after parse error from call string: " + this.callString());
            console.warn("So we'll report back what we have and hope the AI can figure it out.");
        }

        // Add parse-specific information to the error
        e.name = "ToolCallParseError";
        e.extraMessage = "Error parsing tool call JSON. Please fix the call string and try again.";

        if (toolName !== undefined) {
        // lets get the tool definition schema so we can remind the AI of the expected format
            const toolDefinition = this.toolDefinitionForToolName(toolName);
            if (toolDefinition !== null) {
                const toolCallSchema = ToolCall.toolCallJsonSchemaForToolDefinition(toolDefinition);
                const toolCallSchemaString = JSON.stringify(toolCallSchema, null, 2);
                e.extraMessage += "\nThe '" + toolName + "' tool call schema is\n " + toolCallSchemaString;
            }
        }

        // Report parse error to the server if SvApp is available
        try {
            const errorData = {
                name: "ToolCallParseError",
                message: e.message,
                extraMessage: e.extraMessage,
                stack: e.stack,
                toolCall: {
                    toolName: this.toolName(),
                    callId: this.callId(),
                    callString: this.callString()
                }
            };

            SvErrorReport.asyncSend(e, errorData).catch(error => {
                console.error("Failed to report tool call parse error:", error);
            });
        } catch (reportError) {
            console.error("Error while trying to report tool call parse error:", reportError);
        }

        this.handleCallError(e);
    }

    toolTarget () {
        let toolDefinition = this.toolDefinition();

        if (toolDefinition === null) {
            this.findToolDefinition();
            toolDefinition = this.toolDefinition();
        }

        if (toolDefinition === null) {
            throw new Error(this.logPrefix() + ".toolTarget() - Tool definition not found for tool call: " + this.toolName());
        }

        return toolDefinition.toolTarget();
    }

    parametersDict () {
        return this.callJson().parameters;
    }

    // helpers

    isOnStreamTool () {
        return this.toolDefinition().toolMethod().callsOnStreamTool();
    }

    isOnCompletionTool () {
        return this.toolDefinition().toolMethod().callsOnCompletionTool();
    }

    isOnNarrationTool () {
        return this.toolDefinition().toolMethod().callsOnNarrationTool();
    }

    isBlockingTool () {
        return this.toolDefinition().toolMethod().isBlockingTool();
    }

    // make call

    async makeCall () {
        assert(this.isQueued(), "Tool call is not queued, it's '" + this.status() + "', but we haven't done makeCall() yet");

        try {
            this.setStatus("calling");

            let toolTarget = this.toolTarget();
            let methodName = this.toolDefinition().name();
            let method = toolTarget.methodNamed(methodName);
            //const parametersDict = this.parametersDict();

            // should we instantiate the parameter objects and replace them as values in the json, or just pass the json?
            // we should probably do the latter as it's more flexible
            // however, we don't want each tool call method to have to repeat code to:
            // - parse the parameters,
            // - instantiate the parameter objects
            // - potentially deal with errors such as:
            //   - invalid spec errors
            //   - missing required parameters
            //   - invalid parameter types
            //   - unknown parameters
            //   - etc.

            // Call the method and handle both sync and async functions
            const isAsync = Type.isAsyncFunction(method);
            let result;

            if (isAsync) {
                result = await method.apply(toolTarget, [this]);
            } else {
                result = method.apply(toolTarget, [this]);
            }

            console.log("---- TOOLCALL RESULT: ", result);

            // NOTES:
            // 1) there are methods that don't immediately return a value, such as dice rolls,
            // so we need to be able to return *without* having a result value yet and
            // leave it up to the method to call setCallResult() when the result is ready.
            // or handleCallError() if there is an error.

            // we also have to catch the errors that are thrown from the method

            /*
            let resultValue = method.apply(toolTarget, [this]);
            if (Type.isUndefined(resultValue)) {
                resultValue = null; // should we make this more strict and throw an error?
            }
            this.handleCallSuccess(resultValue);
            */
        } catch (e) {
            console.error("---- TOOLCALL ERROR: ", e, " Error making tool call: " + this.toolDefinition().name());
            this.handleCallError(e);
        }
    }

    newToolResult () {
        const r = ToolResult.clone();
        r.setCallId(this.callId());
        r.setToolName(this.toolName());
        r.setToolCall(this);
        return r;
    }

    handleCallSuccess (resultValue) {
        try {
            Type.assertIsJsonType(resultValue);
        } catch (e) {
            console.error("Error asserting that resultValue is a JSON type: " + e.message);
            Type.assertIsJsonType(resultValue);
        }

        this.setStatus("completed");

        const r = this.newToolResult();
        r.setResult(resultValue);
        r.setStatus("success");
        this.setToolResult(r);
        this.toolCalls().onToolCallComplete(this);
    }

    handleCallError (e) {
        this.setStatus("completed");

        if (!Type.isError(e)) {
            e = new Error("handleCallError requires an Error instance");
        }

        console.error("---- TOOLCALL ERROR: " + this.svType() + " Error handling tool call: " + e.message);

        const r = this.newToolResult();
        r.setStatus("failure");
        r.setError(e.message);
        if (e.extraMessage) {
            r.setExtraMessage(e.extraMessage);
        }
        this.setToolResult(r);
        this.toolCalls().onToolCallComplete(this);

        this.reportError(e);
    }

    reportError (e) {
        // Report error to the server if SvApp is available
        const errorData = {
            name: "ToolCallError",
            message: e.message,
            extraMessage: e.extraMessage || null,
            stack: e.stack ? String(e.stack) : null,
            toolCall: {
                toolName: this.toolName(),
                callId: this.callId(),
                status: this.status(),
                toolTarget: this.toolTarget().svType(),
                //toolTargetJson: this.toolTarget().asJson()
            }
        };

        // Add call JSON if available
        if (this.callJson()) {
            errorData.toolCall.parameters = this.callJson().parameters;
        }

        // Don't block execution, send asynchronously
        SvErrorReport.asyncSend(e, errorData);
    }

    hasError () {
        const r = this.toolResult();
        return r !== null && r.hasError();
    }

    hasToolDefinition () {
        return this.toolDefinition() !== null;
    }

    setCallResult (json) {
        // called by the tool method to set the result value
        this.handleCallSuccess(json);
        return this;
    }

    setCallError (error) {
        // called by the tool method to set the error value
        const normalizedError = Error.normalizeError(error);
        console.error(this.logPrefix() + "'" + this.toolName() + "' tool call failed with error: ", normalizedError.message);
        this.handleCallError(normalizedError);
        return this;
    }

    // --- Extract callId from invalid JSON ---

    extractCallIdFromInvalidJson (invalidJsonString) {
        try {
            // Try to repair the JSON
            const repairedJson = jsonRepair(invalidJsonString);
            // Parse the repaired JSON
            const parsedJson = JSON.parse(repairedJson);
            // Return the callId if it exists
            return parsedJson.callId; // TODO: handle the case where callId is not a string
        } catch (error) {
            console.error("Failed to repair JSON:", error);
            // Fall back to regex approach if repair fails
            return this.extractCallIdWithRegex(invalidJsonString);
        }
    }

    extractCallIdWithRegex (invalidJsonString) {
    // This regex looks for "callId": followed by a string or number value
        const callIdRegex = /"callId"\s*:\s*(?:"([^"]*)"|([\d]+))/;
        const match = invalidJsonString.match(callIdRegex);

        if (match) {
            // Return either the string value (match[1]) or the numeric value (match[2])
            return match[1] || match[2];
        }

        return null; // No callId found
    }

}.initThisClass());
