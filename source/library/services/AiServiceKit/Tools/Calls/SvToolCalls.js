"use strict";

/**
* @module library.services.AiServiceKit.Tools.Calls
* @class SvToolCalls
* @extends SvSummaryNode
* @classdesc An array of SvToolCall instances.
*/

(class SvToolCalls extends SvSummaryNode {
    /*
   * Initializes the prototype slots.
   * @category Initializationsph
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("assistantToolKit", null);
            slot.setSlotType("SvAssistantToolKit");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvToolCall]);
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

        const toolCall = SvToolCall.clone();
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

    /**
     * @description Handles a tool-call tag found inside an ignored block
     * (e.g. <think>) — the model shouldn't emit tool calls there, but when it
     * does we must not leave it hanging on a call that never registered.
     * NEVER executes the call. Instead:
     *   - a duplicate of an already-registered call (same callId, or same
     *     toolName+parameters) attaches a warning to the real call's result;
     *   - a call whose response was already sent is dropped (can't amend it);
     *   - otherwise the call settles immediately as completed-with-error on
     *     its own callId, telling the AI to re-emit it outside the block
     *     (parse errors settle through the normal parse-error path, with the
     *     inside-<think> context prepended via sourceContextTagName).
     * @param {string} innerTagString - The tool call JSON string.
     * @param {SvAiResponseMessage} aMessage - The message the tag was found in.
     * @param {string} contextTagName - The ignored ancestor tag name (e.g. "think").
     * @returns {SvToolCall|null} The settled or warned call, or null if dropped.
     * @category Tool Calls
     */
    handleOrphanedToolCallTagFromMessage (innerTagString, aMessage, contextTagName) {
        this.assertHasAssistantToolKit();
        const ctx = contextTagName || "think";

        const toolCall = SvToolCall.clone();
        toolCall.setToolCalls(this);
        toolCall.setMessage(aMessage);
        toolCall.setSourceContextTagName(ctx);
        toolCall.handleCallString(innerTagString); // a parse error settles it with the context-prefixed parse error

        if (!toolCall.hasError()) {
            // response already sent for this callId? Nothing useful to amend — drop.
            const tk = this.assistantToolKit();
            const respondedPools = [tk.successfulToolCalls(), tk.failedToolCalls()];
            const alreadyResponded = respondedPools.some((pool) => pool && pool.toolCallWithId(toolCall.callId()));
            if (alreadyResponded) {
                console.warn(this.logPrefix(), "orphaned <" + ctx + "> copy of already-responded call " + toolCall.callId() + " — dropping");
                return null;
            }

            // duplicate of a registered (pending or completed-unsent) call → warn on the real one
            const existing = this.toolCallWithId(toolCall.callId()) || this.toolCallMatchingCall(toolCall);
            if (existing) {
                existing.addWarning("WARNING: a copy of this tool call (callId \"" + toolCall.callId() + "\") was also found inside your <" + ctx +
                    "> block and was ignored. NEVER place tool calls inside <" + ctx + "> — always emit them at the top level of your response.");
                console.warn(this.logPrefix(), "orphaned <" + ctx + "> duplicate of call " + toolCall.callId() + " — warned on the registered call");
                return existing;
            }

            // resolve the tool definition when we can (for schema context in the
            // result), but never execute
            if (toolCall.toolName()) {
                const toolDef = this.toolDefinitionWithName(toolCall.toolName());
                if (toolDef) {
                    toolCall.setToolDefinition(toolDef);
                }
            }

            toolCall.handleCallError(new Error("This tool call was found inside a <" + ctx + "> block and was NOT executed — tool calls inside <" + ctx +
                "> are ignored. If you intended to make this call, re-emit it at the top level of your response, after the closing </" + ctx + "> tag."));
        }

        this.addSubnode(toolCall); // keep it around so its error response gets sent
        this.onToolCallAdded(toolCall);
        return toolCall;
    }

    /**
     * @description Finds a registered call with the same toolName and identical
     * parameters as the given call (a re-drafted duplicate with a new callId).
     * @param {SvToolCall} aToolCall - The call to match against.
     * @returns {SvToolCall|null} The matching registered call, if any.
     * @category Tool Calls
     */
    toolCallMatchingCall (aToolCall) {
        if (!aToolCall.callJson()) {
            return null;
        }
        const name = aToolCall.toolName();
        const paramsString = JSON.stableStringifyWithStdOptions(aToolCall.parametersDict());
        return this.subnodes().find((tc) => tc !== aToolCall &&
            tc.toolName() === name &&
            tc.callJson() &&
            JSON.stableStringifyWithStdOptions(tc.parametersDict()) === paramsString) || null;
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

    removeAllCalls () {
        // TODO: call abort on any tool calls that are in progress?
        this.removeAllSubnodes();
    }

    addCalls (subnodes) {
        this.addSubnodes(subnodes);
    }


}.initThisClass());
