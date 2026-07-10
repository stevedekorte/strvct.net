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
            //debugger;
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
            // callId collision — the model reused an id (numbering slip or a
            // re-emit). NEVER swallow the call silently: a call the AI emitted
            // that never produces a result wedges the conversation (the AI
            // waits forever for it).
            const registered = this.toolCallWithId(toolCall.callId());
            const collision = registered || this.respondedToolCallWithId(toolCall.callId());
            if (collision) {
                if (registered && this.callsMatch(registered, toolCall)) {
                    // Exact re-emit of a call that is still pending/unsent:
                    // harmless repeat — warn on the real call's result.
                    registered.addWarning("WARNING: you emitted this tool call (callId \"" + toolCall.callId() +
                        "\") more than once; the duplicate copy was ignored. Emit each call exactly once and wait for its result.");
                    console.warn(this.logPrefix(), "duplicate re-emit of call " + toolCall.callId() + " — warned on the registered call");
                    return registered;
                }
                // A DIFFERENT call reusing the id, or a repeat of a call whose
                // response was already sent: settle THIS call as an error so the
                // AI receives a result for it and can re-emit with a fresh id.
                const detail = this.callsMatch(collision, toolCall)
                    ? "a tool call with callId \"" + toolCall.callId() + "\" already completed and its result was already sent to you"
                    : "callId \"" + toolCall.callId() + "\" is already in use by a " + collision.toolName() + " call";
                console.warn(this.logPrefix(), "callId collision on " + toolCall.callId() + " (" + toolCall.toolName() +
                    " vs " + collision.toolName() + ") — settling the new call with an error");
                toolCall.handleCallError(new Error(detail + ". This " + toolCall.toolName() +
                    " call was NOT executed. Every tool call needs a UNIQUE callId — re-emit it with a new callId, continuing your sequential numbering."));
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

    /**
     * @description Finds a call with the given callId whose response was
     * already sent to the assistant (i.e. it lives in the toolkit's
     * successful or failed pools rather than the pending pool).
     * @param {string} callId - The callId to look up.
     * @returns {SvToolCall|null}
     * @category Tool Calls
     */
    respondedToolCallWithId (callId) {
        const tk = this.assistantToolKit();
        const pools = [tk.successfulToolCalls(), tk.failedToolCalls()];
        for (const pool of pools) {
            if (pool) {
                const match = pool.toolCallWithId(callId);
                if (match) {
                    return match;
                }
            }
        }
        return null;
    }

    /**
     * @description Whether two calls are the same call (same toolName and
     * identical parameters). Used to distinguish a harmless re-emit from a
     * callId collision between different calls.
     * @param {SvToolCall} a
     * @param {SvToolCall} b
     * @returns {Boolean}
     * @category Tool Calls
     */
    callsMatch (a, b) {
        if (!a.callJson() || !b.callJson()) {
            return false;
        }
        return a.toolName() === b.toolName() &&
            JSON.stableStringifyWithStdOptions(a.parametersDict()) === JSON.stableStringifyWithStdOptions(b.parametersDict());
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
