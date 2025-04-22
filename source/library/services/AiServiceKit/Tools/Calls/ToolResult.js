"use strict";
/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolResult
* @extends BMJsonDictionaryNode
* @classdesc A specific response to a tool call.
*/

//HwJsonDictionaryNode
(class ToolResult extends BMSummaryNode {

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
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("callId", null);
      slot.setDescription("A unique identifier included in the tool call to which this is a response.");
      slot.setSlotType("String");
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("status", null);
      slot.setDescription("A string describing the status of the call.");
      slot.setSlotType("String");
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
      slot.setDescription("An error JSON dictionary if the call failed.");
      slot.setSlotType("Dictionary");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(false);
      slot.setShouldStoreSlot(true);
    }

    // ---- END ToolResult JSON schema ----
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
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

}.initThisClass());