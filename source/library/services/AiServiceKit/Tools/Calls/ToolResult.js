"use strict";
/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolResult
* @extends SvJsonDictionaryNode
* @classdesc A specific response to a tool call.
*/

//UoJsonDictionaryNode
(class ToolResult extends SvSummaryNode {

  static enclosingTagName () {
    return "tool-call-result";
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

    {
      const slot = this.newSlot("toolName", null);
      slot.setDescription("The name of the tool that made the call.");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("callId", null);
      slot.setDescription("A unique identifier included in the tool call to which this is a response.");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
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
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("result", null);
      slot.setDescription("A Json object containing the response to the tool call.");
      slot.setSlotType("JSON Object");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
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
    let content = JSON.stableStringify(json);
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
    const toolDefinition = toolCall.toolDefinition();
    return toolDefinition.toolMethod();
  }

  silentSuccess () {
    return this.toolMethod().silentSuccess();
  }

  silentError () {
    return this.toolMethod().silentError();
  }

  doesRequireResponse () {
    if (this.hasSuccess()) {
      return !this.silentSuccess();
    } 
    if (this.hasError()) {
      return !this.silentError();
    }
    throw new Error("Invalid tool result status: " + this.status());
  }

  copyExtraMessage () {
    this.extraMessage().copyToClipboard();
  }


}.initThisClass());