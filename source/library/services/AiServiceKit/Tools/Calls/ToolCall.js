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
    return "Format for Assistant API call to make an '" + this.type() + "' API call.";
  }
  
  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("toolCalls", null);
      slot.setDescription("Reference to the tool calls.");
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
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("status", "queued");
      slot.setDescription("The status of the call.");
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
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

  findToolDefinition () {
    if (this.toolDefinition() === null) {
      const def = this.toolCalls().toolDefinitionWithName(this.toolName());
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


  didUpdateSlotCallString (oldValue, newValue) {
    if (oldValue !== this.callString() && newValue !== null) {
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
            repairShop.repair();
            callString = repairShop.jsonString();

            if (!repairShop.isValid()) {
                const error = new Error(repairShop.errorString());
                this.handleParseError(error);
                return;
            }

            callString = repairShop.jsonString();
        }

        const json = JSON.parse(callString);
        this.setCallJson(json);

    } catch (e) {
      this.handleParseError(e);
    }
  }

  didUpdateSlotCallJson (oldValue, newValue) {
    //debugger;
    if (oldValue !== this.callJson() && newValue !== null) {
      this.setToolName(newValue.toolName);
      this.setCallId(newValue.callId);
    }
  }

  assertValidCall () {
    /*
    this.assertValidToolCallSchema();
    this.assertValidParametersSchema();
    */
  }

  assertValidToolCallSchema () {
    const validator = new JsonValidator();
    const toolCallSchema = this.toolDefinition().toolMethod().asJsonSchema();
    validator.setJsonSchema(toolCallSchema);
    const isValid = validator.validate(this.callJson());
    if (!isValid) {
      const e = new Error(validator.errorMessageForLLM());
      this.handleCallError(e);
    }
  }

  assertValidParametersSchema () {
    const validator = new JsonValidator();
    const paramsSchema = this.toolDefinition().toolMethod().paramsSchema(new Set());
    validator.setJsonSchema(paramsSchema);
    const isValid = validator.validate(this.parametersDict());
    if (!isValid) {
      const e = new Error(validator.errorMessageForLLM());
      this.handleCallError(e);
    }
  }

  handleParseError (e) {
    //throw new Error(this.type() + " Error parsing call string: " + e.message);
    const jsonRepairShop = new JsonRepairShop();
    jsonRepairShop.setJsonString(this.callString());

    const callId = jsonRepairShop.extractProperty("callId");
    assert(callId !== undefined);
    this.setCallId(callId); 

    const toolName = jsonRepairShop.extractProperty("toolName");
    assert(toolName !== undefined);
    this.setToolName(toolName);

    // Add parse-specific information to the error
    e.extraMessage = "Error parsing tool call JSON";
    e.name = "ToolCallParseError";
    
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
        
        debugger;
        SvErrorReport.asyncSend(e, errorData).catch(error => {
          console.error("Failed to report tool call parse error:", error);
        });
    } catch (reportError) {
      console.error("Error while trying to report tool call parse error:", reportError);
    }

    this.handleCallError(e);
  }

  toolTarget () {
    return this.toolDefinition().toolTarget();
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

  // make call

  makeCall () {
    assert(this.isQueued());

    try {
      this.setStatus("calling");

      const toolTarget = this.toolTarget();
      const methodName = this.toolDefinition().name();
      const method = toolTarget.methodNamed(methodName);
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

      method.apply(toolTarget, [this]);
      /*
      let resultValue = method.apply(toolTarget, [this]);
      if (Type.isUndefined(resultValue)) {
        resultValue = null; // should we make this more strict and throw an error?
      }
      this.handleCallSuccess(resultValue);
      */
    } catch (e) {
        debugger;
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
    Type.assertIsJsonType(resultValue);
    this.setStatus("completed");

    const r = this.newToolResult();
    r.setResult(resultValue);
    r.setStatus("success");
    this.setToolResult(r);
    this.toolCalls().onToolCallComplete(this);
  }
  
  handleCallError (e) {
    if (!Type.isError(e)) {
      e = new Error("handleCallError requires an Error instance");
      debugger;
    }

    console.error("---- TOOLCALL ERROR: " + this.type() + " Error handling tool call: " + e.message);
    //debugger;

    this.setStatus("completed");

    const r = this.newToolResult();
    r.setError(e.message);
    if (e.extraMessage) {
      r.setExtraMessage(e.extraMessage);
    }
    r.setStatus("failure");
    this.setToolResult(r);
    this.toolCalls().onToolCallComplete(this);
    console.error("---- TOOLCALL ERROR: " + this.type() + " Error handling tool call: " + e.message);
    
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
          toolTarget: this.toolTarget().type(),
          //toolTargetJson: this.toolTarget().asJson()
        }
      };
      
      // Add call JSON if available
      if (this.callJson()) {
        errorData.toolCall.parameters = this.callJson().parameters;
      }
      
      // Don't block execution - use setTimeout to post error asynchronously

      SvErrorReport.asyncSend(e, errorData).catch(error => {
          console.error("Failed to report tool call error:", error);
    });

  }

  hasError () {
    const r = this.toolResult();
    return r !== null && r.hasError(); 
  }

  hasToolDefinition () {
    return this.toolDefinition() !== null;
  }

  setCallResult (json) {
    //debugger;
    this.handleCallSuccess(json);
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
      console.error('Failed to repair JSON:', error);
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