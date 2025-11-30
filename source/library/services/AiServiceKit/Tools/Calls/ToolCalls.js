"use strict";

/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolCalls
* @extends SvSummaryNode
* @classdesc An array of ToolCall instances.
*/

(class ToolCalls extends SvSummaryNode {
    /*
   * Initializes the prototype slots.
   * @category Initializationsph
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("assistantToolKit", null);
            slot.setSlotType("AssistantToolKit");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([ToolCall]);
        this.setSummaryFormat("value");
        this.setHasNewlineAfterSummary(true);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(false);

        this.setNoteIsSubnodeCount(true);
        this.setShouldStoreSubnodes(true);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Active Tool Calls");
        this.setNoteIsSubnodeCount(true);
        this.setNoteIconName(null);
    }

    howToMakeToolCallsPrompt () {
    // TODO: make tag name configurable

        // load HowToMakeToolCallsPrompt.txt;
        throw new Error("Not implemented");
    }

    assertHasAssistantToolKit () {
        const assistantToolKit = this.assistantToolKit();
        if (!assistantToolKit) {
            const msg = "Tool calls has an assistantToolKit slot that is null";
            console.error(msg);
            debugger;
            throw new Error(msg);
        }
    }

    toolDefinitionWithName (name) {
        this.assertHasAssistantToolKit();
        return this.assistantToolKit().toolDefinitions().toolDefinitionWithName(name);
    }

    handleToolCallTagFromMessage (innerTagString, aMessage) {
        this.assertHasAssistantToolKit();

        const toolCall = ToolCall.clone();
        toolCall.setToolCalls(this);

        //assert(aMessage);
        toolCall.setMessage(aMessage);
        //assert(toolCall.message());

        toolCall.handleCallString(innerTagString);

        if (toolCall.toolName()) { // might not have one if there's a parse error
            const toolDef = this.toolDefinitionWithName(toolCall.toolName());
            assert(toolDef, this.logPrefix() + ".handleToolCallTagFromMessage() - Tool definition not found for tool call: " + toolCall.toolName());
            toolDef.assertMethodExists();
            // this.toolCall().reportErrorToAssistant(new Error("Tool definition not found for tool call: " + toolCall.toolName()));
            toolCall.setToolDefinition(toolDef);
        }

        toolCall.assertValidCall();

        if (!toolCall.hasError()) {
            // check if the tool call id is already in the tool calls
            const existingToolCall = this.toolCallWithId(toolCall.callId());
            if (existingToolCall) {
                // should we report an error to the assistant or user?
                // maybe the LLM failed to create a unique id for the tool call
                // or maybe the tool call is being repeated
                return existingToolCall;
            }
        }

        this.addSubnode(toolCall); // in case there's an error or result response, we'll need to keep the tool call around
        this.onToolCallAdded(toolCall);
        //toolCall.handleCall(); // this may wait for this message to complete

        // when a tool call is complete, it should add a tool result to the tool results
        // results should create a message to respond to the tool call
        // but how do we pool these together and send them as a single message?
        return toolCall;
    }

    onToolCallAdded (toolCall) {
        this.assistantToolKit().onToolCallAdded(toolCall);
    }

    toolCallWithId (callId) {
        return this.subnodes().find((subnode) => subnode.callId() === callId);
    }

    onToolCallComplete (toolCall) {
        this.assistantToolKit().onToolCallComplete(toolCall);
    }

    completedCalls () {
        return this.subnodes().filter((toolCall) => toolCall.isCompleted());
    }

    incompleteCalls () {
        return this.subnodes().filter((toolCall) => !toolCall.isCompleted());
    }

    queuedCalls () {
        return this.subnodes().filter((toolCall) => toolCall.isQueued());
    }

    queuedOnCompletionCalls () {
        return this.onCompletionCalls().filter((toolCall) => toolCall.isQueued());
    }

    onCompletionCalls () {
        return this.subnodes().filter((toolCall) => toolCall.isOnCompletionTool());
    }

    removeCalls (subnodes) {
        this.removeSubnodes(subnodes);
    }

    addCalls (subnodes) {
        this.addSubnodes(subnodes);
    }


}.initThisClass());
