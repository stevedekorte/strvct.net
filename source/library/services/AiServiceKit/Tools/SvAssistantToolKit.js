"use strict";

/**
* @module library.services.AiServiceKit.Tools
* @class SvAssistantToolKit
* @extends SvSummaryNode
* @classdesc Manages the tool definitions and calls for an SvAiConversation.
* Notes:
* - toolCalls is the queue of tool calls to be made.
* - each call has a link to it's toolResult
*/

(class SvAssistantToolKit extends SvSummaryNode {
    /*
   * Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("conversation", null); // a reference to the conversation which owns this object
            slot.setSlotType("SvConversation");
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("toolDefinitions", null);
            slot.setFinalInitProto(SvToolDefinitions);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("toolCalls", null);
            slot.setFinalInitProto(SvToolCalls);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("failedToolCalls", null);
            slot.setFinalInitProto(SvToolCalls);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("successfulToolCalls", null);
            slot.setFinalInitProto(SvToolCalls);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        {
            const slot = this.newSlot("runtimeEventReports", null);
            slot.setFinalInitProto(SvRuntimeEventReports);
            slot.setShouldJsonArchive(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
        }

        {
            // loop-guard state: coalesceKey -> consecutive drains that included it.
            // Session-local diagnostics, not persisted.
            const slot = this.newSlot("runtimeEventGuardCounts", null);
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setIsInJsonSchema(false);
        }
    }

    initPrototype () {
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

    finalInit () {
        super.finalInit();
        this.setTitle("SvAssistantToolKit");
        this.toolCalls().setAssistantToolKit(this);
        this.failedToolCalls().setTitle("Failed Tool Call Errors");
        this.successfulToolCalls().setTitle("Successful Tool Calls");
        this.runtimeEventReports().setAssistantToolKit(this);
        this.setRuntimeEventGuardCounts(new Map());
    }

    handleToolCallTagFromMessage (innerTagString, aMessage) {
        this.toolCalls().handleToolCallTagFromMessage(innerTagString, aMessage);
    }

    handleOrphanedToolCallTagFromMessage (innerTagString, aMessage, contextTagName) {
        this.toolCalls().handleOrphanedToolCallTagFromMessage(innerTagString, aMessage, contextTagName);
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
        if (!this._shouldProcessToolCalls()) return;
        if (toolCall.isOnStreamTool()) { //SvToolDefinition.callsOnStreamTool
            // call immediately when seeing in content stream e.g. sfx, music, etc.
            await this.processToolCall(toolCall);
        }
    }

    onMessageComplete (aMsg) {
        //console.log(this.logPrefix(), ".onMessageComplete('" + aMsg.messageId() + "')");
        if (!this._shouldProcessToolCalls()) return;
        if (aMsg.isResponse()) {
            // Ai just completed a message, so we can process the tool calls that were queued for this (or any remaining previous) messages
            this.processQueuedToolCalls();
        }
    }

    onToolCallComplete (/*toolCall*/) {
        if (!this._shouldProcessToolCalls()) return;
        this.scheduleMethod("sendCompletedToolCallResponses", 0);
    }

    /**
     * Cooperative gate: defers to the parent conversation's
     * `shouldProcessToolCalls()` method (default true on
     * SvConversation). App subclasses can return false to suppress
     * all local tool-call execution — useful for multiplayer
     * client/mirror conversations where running the host's tool
     * calls locally would fork the AI session into the client.
     */
    _shouldProcessToolCalls () {
        const conv = this.conversation && this.conversation();
        if (!conv) return true;
        if (typeof conv.shouldProcessToolCalls !== "function") return true;
        return !!conv.shouldProcessToolCalls();
    }

    blockingCalls () {
        return this.toolCalls().incompleteCalls().filter((toolCall) => {
            return toolCall.isBlockingTool();
        });
    }

    /*
    activeAiResponses () {
        return this.conversation().activeResponses();
    }
    */

    hasUncompletedBlockingToolCalls () {
        const isBlocked = this.blockingCalls().length > 0;
        return isBlocked;
    }

    /**
     * Human-readable description of the blocking tool calls still preventing
     * user chat input, or null if none are pending. Model-side fact, surfaced
     * for diagnostics by the conversation when the chat input is gated.
     * @returns {String|null}
     * @category State
     */
    waitingOnDescription () {
        const calls = this.blockingCalls();
        if (calls.length === 0) {
            return null;
        }
        const parts = calls.map(c => {
            const name = (typeof c.toolName === "function" && c.toolName()) ? c.toolName() : "tool";
            const status = (typeof c.status === "function") ? c.status() : "?";
            const id = (typeof c.callId === "function" && c.callId()) ? c.callId() : null;
            return name + (id ? " (" + id + ")" : "") + " [" + status + "]";
        });
        return parts.join(", ");
    }

    canSendResponsesNow () {
        const hasBlockers = this.hasUncompletedBlockingToolCalls();
        const aiIsResponding = this.conversation().hasActiveResponses();
        return !hasBlockers && !aiIsResponding;
    }

    async processQueuedToolCalls () {
        const queuedCalls = this.toolCalls().queuedCalls();
        for (const toolCall of queuedCalls) {
            if (!toolCall.isQueued()) {
                console.error("**ERROR**:", this.logPrefix(), "Tool call is not queued, it's '" + toolCall.status() + "', but we're processing queued tool calls");
                //debugger;
            }
            // assert(toolCall.isQueued(), "sanity check: we're processing queued tool calls, but tool call status is not set to queued");
            await this.processToolCall(toolCall);
        }

        if (this.canSendResponsesNow()) {
            // we wait for all blocking tool calls (e.g. patches, etc.) to complete before sending the completed tool call responses
            // user responses should also be blocked until all blocking tool calls are complete
            this.scheduleMethod("sendCompletedToolCallResponses", 0);
        }
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

    // --- runtime event reports ---
    // The engine→AI feedback queue: events with no owning tool call (response
    // handling exceptions, player edits, roster changes, housekeeping) are
    // queued as SvRuntimeEventReport instances and drained into the same
    // invisible user message as tool-call results. Enqueuing never sends;
    // timing and gating belong entirely to sendCompletedToolCallResponses.
    // See docs: Plans/Runtime Event Reports.

    maxConsecutiveRuntimeEventSends () {
        return 3;
    }

    /**
     * @description Creates an unqueued report stamped with this kit's context.
     * Configure it (setType/setInfo/setImmediacy) then pass it to
     * addRuntimeEventReport. Creation does not enqueue — coalescing needs the
     * configured report.
     * @returns {SvRuntimeEventReport}
     * @category Runtime Events
     */
    newRuntimeEventReport () {
        const report = SvRuntimeEventReport.clone();
        report.setConversation(this.conversation());
        report.setTimestamp(Date.now());
        return report;
    }

    /**
     * @description Coalesces the report against the queue and enqueues it.
     * Never sends. A wakeAI report schedules the send gate, so an idle kit
     * initiates a turn; nextTurn reports ride whatever message next goes out.
     * Mirror/client conversations (shouldProcessToolCalls false) never queue.
     * @param {SvRuntimeEventReport} report
     * @returns {SvRuntimeEventReport|null} the pending report, or null if gated/suppressed
     * @category Runtime Events
     */
    addRuntimeEventReport (report) {
        if (!this._shouldProcessToolCalls()) {
            return null;
        }

        // the factory stamps these; stamp here too so a directly-cloned report isn't broken
        if (report.conversation() === null) {
            report.setConversation(this.conversation());
        }
        if (report.timestamp() === null) {
            report.setTimestamp(Date.now());
        }

        // loop guard: a wakeAI report can ping-pong (report -> AI re-runs ->
        // same event recurs). After N consecutive drains containing the same
        // coalesceKey, stop reporting instead of spinning.
        const key = report.coalesceKey();
        const consecutiveSends = this.runtimeEventGuardCounts().get(key) || 0;
        if (consecutiveSends >= this.maxConsecutiveRuntimeEventSends()) {
            console.error(this.logPrefix(), "runtime event report suppressed after " + consecutiveSends + " consecutive sends (likely a report/response loop): " + key);
            return null;
        }

        const pendingReport = this.runtimeEventReports().addReport(report);
        if (pendingReport.isWakeAI()) {
            this.scheduleMethod("sendCompletedToolCallResponses", 0);
        }
        return pendingReport;
    }

    /**
     * @description Convenience for the engine-internal exception source:
     * wraps a caught Error into a wakeAI responseProcessingError report.
     * @param {Error} error
     * @param {Object} [info] - extra occurrence/attribution fields (tag, phase, excerpt, source, ...)
     * @returns {SvRuntimeEventReport|null}
     * @category Runtime Events
     */
    addRuntimeError (error, info = {}) {
        const report = this.newRuntimeEventReport();
        report.setType("responseProcessingError");
        report.setImmediacy("wakeAI");
        const message = (error && error.message) ? error.message : String(error);
        report.setInfo(Object.assign({ message: message }, info));
        return this.addRuntimeEventReport(report);
    }

    updateRuntimeEventGuard (drainedReports) {
        const counts = this.runtimeEventGuardCounts();
        const sentKeys = new Set(drainedReports.map(r => r.coalesceKey()));
        Array.from(counts.keys()).forEach((key) => {
            if (!sentKeys.has(key)) {
                counts.delete(key); // streak broken — a send went out without this event recurring
            }
        });
        sentKeys.forEach((key) => {
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    }

    // --- sending ---

    async sendCompletedToolCallResponses () {
        const completedCalls = this.toolCalls().completedCalls();
        const uncompletedBlockingToolCalls = this.blockingCalls();
        const activeResponses = this.conversation().activeResponses();

        if (activeResponses.length !== 0 || uncompletedBlockingToolCalls.length !== 0) {
            // we wait for all blocking tool calls (e.g. patches, etc.) to complete before sending the completed tool call responses
            // user responses should also be blocked until all blocking tool calls are complete
            return;
        }

        const callsNeedingResponse = this.completedCallsRequiringResponse();
        // a message goes out for tool results needing a response, or for a
        // wakeAI runtime event report; nextTurn reports never initiate a send —
        // they ride along when a message is going out anyway
        const willSendMessage = callsNeedingResponse.length > 0 || this.runtimeEventReports().hasWakeReports();

        if (willSendMessage) {
            const parts = [];
            if (callsNeedingResponse.length > 0) {
                parts.push(this.composeResponseForToolCalls(completedCalls));
            }
            const drainedReports = this.runtimeEventReports().pendingReports();
            drainedReports.forEach(r => parts.push(r.composeRuntimeEventBlock()));
            this.runtimeEventReports().removeReports(drainedReports);
            this.updateRuntimeEventGuard(drainedReports);
            const speakerName = callsNeedingResponse.length > 0 ? "Tool Call Results" : "Runtime Events";
            this.newCallResponseMessage(speakerName, parts.join("\n\n"));
        }

        if (completedCalls.length > 0) {
            this.toolCalls().removeCalls(completedCalls);

            const failedCalls = completedCalls.filter((toolCall) => toolCall.hasError());
            const successfulCalls = completedCalls.filter((toolCall) => !toolCall.hasError());
            this.successfulToolCalls().addCalls(successfulCalls);
            this.failedToolCalls().addCalls(failedCalls);
        }
    }

    newCallResponseMessage (speakerName, content) {
        const m = this.conversation().newUserMessage();
        m.setSpeakerName(speakerName || "Tool Call Results");
        m.setContent(content);
        m.setIsVisibleToUser(false);
        assert(!m.isVisibleToUser(), "Tool call results should not be visible to user");
        //debugger;
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

    removeAllToolCalls () {
        this.toolCalls().removeAllCalls();
        return this;
    }

}.initThisClass());
