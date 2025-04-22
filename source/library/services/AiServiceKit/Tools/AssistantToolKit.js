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
      if (toolCall.isQueued() && toolCall.isOnStreamTool()) {
        toolCall.makeCall();
      }
    }
  }

  onMessageComplete (aMsg) {
    debugger;
    if (aMsg.isResponse()) {
        const queuedOnCompletionCalls = this.toolCalls().queuedOnCompletionCalls();
        queuedOnCompletionCalls.forEach((toolCall) => {
          toolCall.makeCall();
        });
        this.sendCompletedToolCallResponses();
      }
  }

  onToolCallComplete (toolCall) {
    // a place to add a hook for when a tool call is complete
  }


  sendCompletedToolCallResponses () {
    const completedCalls = this.toolCalls().completedCalls();
    if (completedCalls.length > 0) {
      const m = this.conversation().newUserMessage();
      const content = this.composeResponseForToolCalls(completedCalls);
      m.setContent(content);
      m.setIsVisibleToUser(false);
      m.setIsComplete(true);
      assert(!m.isVisibleToUser());
      this.toolCalls().removeCalls(completedCalls);
    }
  }

  composeResponseForToolCalls (completedCalls) {
    const parts = [];
    completedCalls.forEach((toolCall) => {
      if (toolCall.toolResult().doesRequireResponse()) {
        parts.push(toolCall.toolResult().composeResponseString());
      }
    });
    const content = "<tool-call-results>\n\n" + parts.join("\n\n") + "\n\n</tool-call-results>";
    return content;
  }

}.initThisClass());