"use strict";

/*
* @module library.services.AiServiceKit.Tools
* @class AssistantToolKit 
* @extends BMSummaryNode
* @classdesc Manages the tool definitions and calls for an AiConversation.
* Notes:
* - toolCalls is the queue of tool calls to be made.
* - each call has a link to it's toolResult
*/

(class AssistantToolKit extends BMSummaryNode {
  /*
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("conversation", null);
      const slot = this.newSlot("conversation", null); // a reference to the conversation which owns this object
      slot.setSlotType("Conversation");
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("toolDefinitions", null);
      slot.setFinalInitProto(ToolDefinitions);
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("toolCalls", null);
      slot.setFinalInitProto(ToolCalls);
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("errors", null);
      slot.setFinalInitProto(ToolCalls);
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
      slot.setShouldStoreSlot(true);
    }

    /*
    {
      const slot = this.newSlot("toolResults", null);
      slot.setFinalInitProto(ToolResults);
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }
    */

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);

    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit();
    this.setTitle("AssistantToolKit");
    this.toolCalls().setAssistantToolKit(this);
    this.errors().setTitle("Tool Call Errors");
  }

  handleToolCallTagFromMessage (innerTagString, aMessage) {
    this.toolCalls().handleToolCallTagFromMessage(innerTagString, aMessage);
  }

  formatsPrompt () {
    debugger;
    return `### Formats

The following formats will be used for tool calls and responses:
- JSON format: RFC 8259
- JSON schema format: RFC 8927 for core concepts, RFC 8928 for validation rules, RFC 8926 for relative JSON Pointer syntax.
- JSON patch format: RFC 6902`;
  }

  fullToolCallPrompt () {
    debugger;
    const prompt = [
      "## Tool Call Details", 
      this.formatsPrompt(),
      this.toolCalls().howToMakeToolCallsPrompt(), 
      this.toolDefinitions().toolSpecPrompt()
    ].join("\n\n");

    return prompt;
  }

  formalToolSpecificationsPrompt () {
    debugger;
    return this.toolDefinitions().toolSpecPrompt();
  }

  toolTypesJson () {
    debugger;
    return this.toolDefinitions().toolTypesJson();
  }

    /*
       Notes:
       Tool call times:
       - while the assistant message is streaming (callsOnStreamTool = true)
       - after the assistant message is complete (callsOnCompletionTool = true)
       - while the assistant message is being voice narrated (callsOnNarrationTool = true)

       All tool call results are sent to the assistant *after* the assistant message is complete,
       and the tool call is complete.

       So, when a tool call is added, we need to
  */


  onToolCallAdded (toolCall) {
    if (toolCall.isOnStreamTool()) {
      assert(toolCall.isQueued());
      toolCall.makeCall();
    }
  }

  onMessageComplete (aMsg) {
    console.log(this.type() + ".onMessageComplete('" + aMsg.messageId() + "')");
    //debugger;
    if (aMsg.isResponse()) { // should we only call the tools from this message?
       this.processQueuedToolCalls();
      }
  }

  onToolCallComplete (/*toolCall*/) {
    this.scheduleMethod("sendCompletedToolCallResponses", 0);
  }

  processQueuedToolCalls () {
    const queuedCalls = this.toolCalls().queuedCalls();
    queuedCalls.forEach((toolCall) => {
      assert(toolCall.isQueued());
      if (!toolCall.isOnNarrationTool()) {
        toolCall.makeCall();
      }
    });
    this.scheduleMethod("sendCompletedToolCallResponses", 0);
  }

  async sendCompletedToolCallResponses () {
    const completedCalls = this.toolCalls().completedCalls();
    if (completedCalls.length > 0) {
      if (completedCalls.filter((toolCall) => toolCall.toolResult().doesRequireResponse()).length > 0) {
        //debugger;
        const m = this.conversation().newUserMessage();
        m.setSpeakerName("Tool Call Results");
        const content = this.composeResponseForToolCalls(completedCalls);
        m.setContent(content);
        m.setIsVisibleToUser(false);
        //debugger;
        m.setIsComplete(true); // does this trigger a requestResponse by the conversation assistant?
        //const responseMessage = m.requestResponse();
        //await responseMessage.completionPromise();
        //debugger;
        assert(!m.isVisibleToUser());
      }
      this.toolCalls().removeCalls(completedCalls);
      this.errors().addCalls(completedCalls.filter((toolCall) => toolCall.hasError()));
    }
  }

  composeResponseForToolCalls (completedCalls) {
    const parts = [];
    completedCalls.forEach((toolCall) => {
      if (toolCall.toolResult().doesRequireResponse()) { // will skip silent responses
        parts.push(toolCall.toolResult().composeResponseString());
      }
    });
    const content = "<tool-call-results>\n\n" + parts.join("\n\n") + "\n\n</tool-call-results>";
    return content;
  }

}.initThisClass());