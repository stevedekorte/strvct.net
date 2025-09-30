"use strict";

/*
* @module library.services.AiServiceKit.Tools
* @class AssistantToolKit
* @extends SvSummaryNode
* @classdesc Manages the tool definitions and calls for an AiConversation.
* Notes:
* - toolCalls is the queue of tool calls to be made.
* - each call has a link to it's toolResult
*/

(class AssistantToolKit extends SvSummaryNode {
    /*
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
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
            slot.setShouldStoreSlot(false);
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
        return `### Formats

The following formats will be used for tool calls and responses:
- JSON format: RFC 8259
- JSON schema format: RFC 8927 for core concepts, RFC 8928 for validation rules, RFC 8926 for relative JSON Pointer syntax.
- JSON patch format: RFC 6902`;
    }

    fullToolCallPrompt () { // is this used?
        const prompt = [
            "## Tool Call Details",
            this.formatsPrompt(),
            this.toolCalls().howToMakeToolCallsPrompt(),
            this.toolDefinitions().toolSpecPrompt()
        ].join("\n\n");

        return prompt;
    }

    formalToolSpecificationsPrompt () { // is this used?
        const s = this.toolDefinitions().toolSpecPrompt();
        assert(s.includes("rollRequest"), "rollRequest tool not found in toolSpecPrompt");
        return s;
    }

    toolTypesJson () { // is this used?
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


    async onToolCallAdded (toolCall) {
        if (toolCall.isOnStreamTool()) {
            await this.processToolCall(toolCall);
        }
    }

    onMessageComplete (aMsg) {
        console.log(this.logPrefix(), ".onMessageComplete('" + aMsg.messageId() + "')");

        if (aMsg.isResponse()) { // should we only call the tools from this message?
            this.processQueuedToolCalls();
        }
    }

    onToolCallComplete (/*toolCall*/) {
        this.scheduleMethod("sendCompletedToolCallResponses", 0);
    }

    async processQueuedToolCalls () {
        const queuedCalls = this.toolCalls().queuedCalls();
        for (const toolCall of queuedCalls) {
            assert(toolCall.isQueued(), "sanity check: we're processing queued tool calls, but tool call status is not set to queued");
            await this.processToolCall(toolCall);
        }
        this.scheduleMethod("sendCompletedToolCallResponses", 0);
    }

    async processToolCall (toolCall) {
        if (toolCall.isCompleted()) { // might have had a parse error
            assert(toolCall.hasError(), "Tool call is completed but has no error");
            return;
        }

        if (!toolCall.isOnNarrationTool()) { // TODO: handling this in a more general way
            await toolCall.makeCall();
        }
    }

    completedCallsRequiringResponse () {
        return this.toolCalls().completedCalls().filter((toolCall) => {
            const result = toolCall.toolResult();
            return result && result.doesRequireResponse();
        });
    }

    async sendCompletedToolCallResponses () {
        const completedCalls = this.toolCalls().completedCalls();
        if (completedCalls.length > 0) {
            if (this.completedCallsRequiringResponse().length > 0) {
                const content = this.composeResponseForToolCalls(completedCalls);
                this.newCallResponseMessage("Tool Call Results", content);
            }
            this.toolCalls().removeCalls(completedCalls);
            this.errors().addCalls(completedCalls.filter((toolCall) => toolCall.hasError()));
        }
    }

    newCallResponseMessage (speakerName, content) {
        const m = this.conversation().newUserMessage();
        m.setSpeakerName("Tool Call Results");
        m.setContent(content);
        m.setIsVisibleToUser(false);
        assert(!m.isVisibleToUser(), "Tool call results should not be visible to user");
        m.setIsComplete(true); // does this trigger a requestResponse by the conversation assistant?
        //const responseMessage = m.requestResponse();
        //await responseMessage.completionPromise();
        assert(m.isVisibleToUser() === false);
        m.setIsVisibleToUser = function (value) {
            assert(value === false, "Tool call results should not be visible to user");
        };
        //console.log(this.logPrefix(), ">>>>>>>>>>>>>>>>>>>>>>> created tool call results message with class: " + m.svType());
        return m;
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
