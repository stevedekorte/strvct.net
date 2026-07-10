"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class SvAiConversation
 * @extends SvConversation
 * @classdesc Represents an AI conversation. It adds state for:
 *  - chat model
 *  - ai speaker name
 *  - token count
 *  - response message class
 *
 * Delgates:
 *  - prompt delegate (to get the system prompt)
 *  - tag delegate (to send tag messages to the client)
 *  - client state delegate (to read and write client state)
 *
 * History:
 *  - jsonHistoryString (stringified json of the chat history)
 *
 * Tools:
 *  - assistantApiCalls (list of tool apis available to the assistant)
 *
 */

(class SvAiConversation extends SvConversation {

    /**
   * @description Initializes the prototype slots for the SvAiConversation class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {SvAiChatModel} chatModel - Reference to SvAiChatModel
     * @category Configuration
     */
        {
            const slot = this.newSlot("chatModel", null);
            slot.setSlotType("SvAiChatModel");
        }

        /**
     * @member {Boolean} hasShownNoChatModelWarning - one-shot guard so the
     * "no chatModel — using default" fallback warning logs at most once per
     * conversation instead of on every chatModel() access.
     * @category Configuration
     */
        {
            const slot = this.newSlot("hasShownNoChatModelWarning", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
        }

        /**
     * @member {SvAiResponseMessage} responseMsgClass - Class for response messages
     * @category Configuration
     */
        {
            const slot = this.newSlot("responseMsgClass", null);
            slot.setSlotType("SvAiResponseMessage class");
        }

        /**
     * @member {Number} tokenCount - Sum of tokens of all messages. A null value means we need to update the token count. We set to null on each new message so we can lazy update the token count.
     * @category State
     */
        {
            const slot = this.newSlot("tokenCount", 0);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }

        /**
     * @member {SvAiService} service - Pointer to SvAiService instance
     * @category Configuration
     */
        {
            const slot = this.newSlot("service", null);
            slot.setSlotType("SvAiService");
        }

        /**
     * @member {String} aiSpeakerName - Name of the AI speaker
     * @category Configuration
     */
        {
            const slot = this.newSlot("aiSpeakerName", null);
            slot.setSlotType("String");
        }

        /**
     * @member {Object} tagDelegate - Delegate to receive tag messages from responses.
     * @category Delegates
     */
        {
            const slot = this.newSlot("tagDelegate", null);
            slot.setSlotType("Object");
        }

        /**
     * @member {Object} assistedObject - Delegate to receive getJson, asRootJsonSchemaString, assistantPromptString messages
     * @category Delegates
     */
        {
            const slot = this.newSlot("assistedObject", null);
            slot.setSlotType("Object");
        }

        /**
     * @member {Object} promptDelegate - Delegate from which we get the system prompt for the conversation.
     * @category Delegates
     */
        {
            const slot = this.newSlot("promptDelegate", null); // on start, we send a systemPromptString message to the delegate.
            slot.setSlotType("Object");
        }

        /**
     * @member {String} jsonHistoryString - The JSON history string of the conversation.
     * @category State
     */
        {
            const slot = this.newSlot("jsonHistoryString", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setCanInspect(false);
        }

        /**
     * @member {SvAssistantToolKit} assistantToolKit - The tool kit for the assistant.
     * @category Configuration
     */
        {
            const slot = this.newSlot("assistantToolKit", null);
            slot.setFinalInitProto(SvAssistantToolKit);
            slot.setCanInspect(true);
        }

        /**
     * @member {SvAiConversationHistory} history - The push-ordered stack of filed episodes
     * (see pushHistory). NOT a subnode — the conversation's subnodes are its messages.
     * @category History
     */
        {
            const slot = this.newSlot("history", null);
            slot.setSlotType("SvAiConversationHistory");
            slot.setFinalInitProto(SvAiConversationHistory);
            slot.setShouldStoreSlot(true);
            slot.setIsInCloudJson(true);
            slot.setCanInspect(true);
            slot.setInspectorPath(this.svType());
        }

        this.initPrototypeToolSlots();
    }

    initPrototype () {
        this.setSubnodeClasses([SvAiMessage]);
        this.setResponseMsgClass(SvAiParsedResponseMessage);

        //this.setNodeMinTileWidth(500);
        //this.setNodeCanEditColumnWidth(true);

        this.setNodeFillsRemainingWidth(true);
        this.setNodeCanEditColumnWidth(false);
        this.setNodeMinTileWidth(600);
    }

    finalInit () {
        super.finalInit();

        // careful - could potentially override descendant initPrototype
        this.setNodeFillsRemainingWidth(true);
        this.setNodeCanEditColumnWidth(false);
        this.setNodeMinTileWidth(600);

        this.setTagDelegate(this); // needed to get tool calls
        this.assistantToolKit().setConversation(this); // TODO: replace with nodeOwner
        this.setResponseMsgClass(SvAiParsedResponseMessage);
    }

    didInit () {
        super.didInit();
        //this.assistantToolKit().toolDefinitions().addToolsForInstance(this); // add any tools defined in the conversation
        return this;
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess();
        this.assistantToolKit().toolDefinitions().addToolsForInstance(this); // add any tools defined in the conversation
        return this;
    }

    initPrototypeToolSlots () { // no super initPrototypeToolSlots() because we are not an assistable JSON group?
        assert(this.isPrototype(), "initPrototypeToolSlots() should only be called on a prototype");

        {
            const tool = this.methodNamed("pushHistory");
            tool.setDescription("Files the settled conversation buffer (everything since the last push) as one titled history episode. The filed messages leave your visible transcript once a newer episode supersedes them, replaced by a one-line record marker; the record itself stays queryable — expand it anytime with a one-off queryClientState peek {select: [{under: <its jsonId>, lod: \"full\"}], default: \"omit\"} — your standing view is untouched. Give records meaningful titles: they are your only index into the past.");
            tool.addParameter("title", "string", "Short episode title, named for what the episode was (e.g. the location just departed).");
            tool.addParameter("subtitle", "string", "OPTIONAL. One line on what happened — outcomes, open threads, notable changes.");
            tool.setReturnTypes(["null"]);
            tool.setIsToolable(true);
            tool.setIsSilentSuccess(true);
            tool.setIsSilentError(false);
            tool.setCallsOnCompletionTool(true);
        }
    }

    jsonHistoryString () {
        const lastMessage = this.messages().last();
        if (lastMessage) {
            const jsonHistory = lastMessage.jsonHistory();
            const s = JSON.stableStringifyWithStdOptions(jsonHistory, null, 2);
            return s;
        }
        return "[no messages]";
    }

    /**
   * @description Gets the service associated with the chat model.
   * @returns {Object} The service object.
   * @category Service
   */
    service () {
        return this.chatModel().service();
    }

    /**
   * @description Gets the chat model for the conversation.
   * @returns {SvAiChatModel} The chat model.
   * @category Configuration
   */
    chatModel () {
        if (this._chatModel) {
            return this._chatModel;
        }

        // Walk up the node ancestry looking for any node that provides a default model
        const ancestor = this.firstParentChainNodeThatRespondsTo("defaultChatModel");
        if (ancestor) {
            return ancestor.defaultChatModel();
        }

        // Final fallback to the global services default
        const model = SvServices.shared().defaultChatModel();
        assert(model, "no default chat model");
        return model;
    }

    /**
   * @description Gets the parent conversations object.
   * @returns {SvAiConversations|null} The parent conversations object or null.
   * @category Navigation
   */
    conversations () {
        const p = this.parentNode();
        if (p && p.thisClass().isKindOf(SvAiConversations)) {
            return p;
        }
        return null;
    }

    /**
   * @description Gets the maximum context token count.
   * @returns {Number} The maximum context token count.
   * @category Configuration
   */
    inputTokenLimit () {
        return this.chatModel().inputTokenLimit();
    }

    /**
   * @description Updates the token count for the conversation.
   * @returns {SvAiConversation} The current instance.
   * @category State
   */
    updateTokenCount () {
        // need to count the tokens in the chat history
        // and update the token count
        //const chatHistory = this.jsonHistoryString();
        // conact all the messages and the system prompt
        const allMessagesString = this.messages().map(m => m.content).join("\n");
        // estimate the token count
        const tokenCount = allMessagesString.length / 4;
        this.setTokenCount(tokenCount);
        return this;
    }

    /**
   * @description Checks and manages the token count.
   * @category State
   */
    checkTokenCount () {
        this.updateTokenCount();
        const tc = this.tokenCount();
        if (tc > this.inputTokenLimit() * 0.9) {
            this.compactTokens();
        }
    }

    /**
   * @description Compacts tokens to manage conversation length.
   * @category State
   */
    compactTokens () {
    }

    /**
   * @description Creates a new assistant message.
   * @returns {SvAiMessage} The new assistant message.
   * @category Message Creation
   */
    newAssistantMessage () {
        if (this.messagesRequiringCompletionBeforeUserResponse().length > 0) {
            this.messagesRequiringCompletionBeforeUserResponse();
            //debugger;
            throw new Error("newAssistantMessage() should not be called if there are messages requiring completion before user response");
        }

        if (!this.hasIncompleteAiResponseMessages()) {
            this.hasIncompleteAiResponseMessages();
            //debugger;
            throw new Error("newAssistantMessage() should not be called if there are incomplete ai response messages");
        }

        if (this.assistantToolKit() && !this.assistantToolKit().canSendResponsesNow()) {
            //debugger;
            this.assistantToolKit().canSendResponsesNow();
            throw new Error("newAssistantMessage() should not be called if the assistant tool kit cannot send responses now");
        }

        const m = this.newMessage();
        m.setSpeakerName(this.aiSpeakerName());
        m.setRole("assistant");
        m.setConversation(this);
        return m;
    }

    /**
   * @description Creates a new system message.
   * @returns {SvAiMessage} The new system message.
   * @category Message Creation
   */
    newSystemMessage () {
        const m = this.newMessage();
        m.setSpeakerName("System Message");
        m.setRole("system");
        m.setIsComplete(true);
        m.setIsVisibleToUser(false);
        m.setConversation(this);
        return m;
    }

    /**
   * @description Creates a new user message.
   * @returns {SvAiMessage} The new user message.
   * @category Message Creation
   */
    newUserMessage () {
        const m = this.newMessage();
        m.setSpeakerName("User");
        m.setRole("user");
        m.setConversation(this);
        return m;
    }

    /**
   * @description Creates a new response message.
   * @returns {SvAiResponseMessage} The new response message.
   * @category Message Creation
   */
    newResponseMessage () {
        const m = this.newMessageOfClass(this.responseMsgClass());
        m.setConversation(this);
        this.addSubnode(m);
        return m;
    }

    /**
   * @description Gets the AI speaker name.
   * @returns {String} The AI speaker name.
   * @category Configuration
   */
    aiSpeakerName () {
        if (this._aiSpeakerName) {
            return this._aiSpeakerName;
        }
        return this.chatModel().title().toUpperCase();
    }

    /**
   * @description Handles chat input value.
   * @param {String} v - The chat input value.
   * @returns {SvAiResponseMessage} The response message.
   * @category Interaction
   */
    onChatInputValue (v) {
        const userMsg = this.newUserMessage();
        userMsg.setContent(v);
        userMsg.setIsComplete(true); // this should trigger a requestResponse
        //userMsg.requestResponse();
        SvSimpleSynth.clone().playSendBeep();
    }

    /**
   * @description Composes the API specification prompt.
   * @returns {String} The API specification prompt.
   * @category Configuration
   */
    composeApiSpecPrompt () {
        let s = "The following APIs are available for you to use:\n\n";
        const apiCallClasses = this.apiCallClasses();
        const apiSpecPrompt = apiCallClasses.map(c => c.apiSpecPrompt()).join("\n\n");
        s += apiSpecPrompt;
        return s;
    }

    /**
   * @description Starts the conversation with a prompt.
   * @param {String} prompt - The initial prompt.
   * @returns {SvAiResponseMessage} The response message.
   * @category Interaction
   */
    startWithPrompt (prompt) {
        this.clear();
        //this.setSystemPrompt(prompt);
        const promptMsg = this.newSystemMessage();
        promptMsg.setContent(prompt);
        const responseMessage = promptMsg.requestResponse();
        return responseMessage;
    }

    clear () {
        this.assistantToolKit().removeAllToolCalls();
        super.clear();
        return this;
    }

    /**
   * @description Handles a new message from an update.
   * @param {SvAiMessage} newMsg - The new message.
   * @category Message Handling
   */
    onNewMessageFromUpdate (/*newMsg*/) {
    }

    /**
   * @description Gets the AI visible history for a response.
   * @param {SvAiResponseMessage} aResponseMessage - The response message.
   * @returns {Array} The visible messages for AI.
   * @category Message Handling
   */
    aiVisibleHistoryForResponse (aResponseMessage) {
        assert(this.messages().includes(aResponseMessage));
        const previousMessages = this.messages().before(aResponseMessage);
        const visibleMessages = previousMessages.select(m => m.isVisibleToAi());
        return visibleMessages;
    }

    /**
   * @description Gets the chat request class.
   * @returns {Class} The chat request class.
   * @category Configuration
   */
    chatRequestClass () {
        return this.service().chatRequestClass();
    }

    /**
   * @description Handles message completion.
   * @param {SvAiMessage} aMsg - The completed message.
   * @returns {SvAiConversation} The current instance.
   * @category Message Handling
   */
    onMessageComplete (aMsg) {
        super.onMessageComplete(aMsg);
        this.assistantToolKit().onMessageComplete(aMsg);
        return this;
    }

    /**
   * @description Shuts down the conversation.
   * @returns {SvAiConversation} The current instance.
   * @category Lifecycle
   */
    shutdown () {
        this.messages().forEach(m => m.performIfResponding("shutdown"));
        return this;
    }

    messagesRequiringCompletionBeforeUserResponse () {
        return this.messages().select(m => m.requiresCompletionBeforeUserResponse());
    }

    /**
   * @description Gets incomplete messages.
   * @returns {Array} The incomplete messages.
   * @category Message Filtering
   */
    incompleteMessages () { // TODO: rename to incompleteMessagesRequiringCompletionBeforeUserResponse()
        // An errored message is TERMINAL — it will never reach completion, so it
        // must not gate user input. Without this, a failed AI response (network
        // error, 401, timeout, etc.) leaves the message permanently incomplete,
        // which keeps acceptsChatInput() false forever: the chat input stays
        // disabled (and Enter is cancelled, so it neither sends nor clears) until
        // a reload rebuilds the conversation without the in-flight errored message.
        return this.messagesRequiringCompletionBeforeUserResponse().select(m => !m.isComplete() && !m.hasError());
    }

    /**
   * @description Checks if there are incomplete messages.
   * @returns {Boolean} True if there are incomplete messages, false otherwise.
   * @category State
   */
    hasIncompleteMessages () {
        return this.incompleteMessages().length > 0;
    }

    incompleteAiResponseMessages () {
        return this.incompleteMessages().select(m => m.isKindOf(SvAiResponseMessage));
    }

    hasIncompleteAiResponseMessages () {
        return this.incompleteAiResponseMessages().length > 0;
    }

    /**
   * @description Gets active responses.
   * @returns {Array} The active responses.
   * @category Message Filtering
   */
    activeResponses () {
        return this.incompleteMessages().filter(m => m.isResponse());
    }

    /**
   * @description Checks if there are active responses.
   * @returns {Boolean} True if there are active responses, false otherwise.
   * @category State
   */
    hasActiveResponses () {
        return this.activeResponses().length > 0;
    }

    /**
   * @description Syncs the chat input state.
   * @returns {SvAiConversation} The current instance.
   * @category State
   */
    syncChatInputState () {
        return this;
    }

    /**
   * @description Checks if the conversation accepts chat input.
   * @returns {Boolean} True if it accepts chat input, false otherwise.
   * @category State
   */
    acceptsChatInput () {
        // we block user input until all blocking tool calls are complete
        if (this.assistantToolKit().hasUncompletedBlockingToolCalls()) {
            return false;
        }

        // we block user input until all messages requiring completion before user response are complete
        if (this.incompleteMessages().length > 0) {
            return false;
        }
        return true;
    }

    /**
     * Diagnostic: a human-readable description of why chat input is currently
     * gated, or null when it is accepted. The view (chat input) asks for this
     * when a send is refused so we can see what we're waiting on instead of a
     * silent lock-up. Model-side fact — aggregates the assistant tool kit's
     * pending blocking calls and any messages still requiring completion; the
     * view does not compute the reason itself.
     * @returns {String|null}
     * @category State
     */
    chatInputBlockingReason () {
        if (this.acceptsChatInput()) {
            return null;
        }
        const reasons = [];
        const toolDesc = this.assistantToolKit().waitingOnDescription();
        if (toolDesc) {
            reasons.push("blocking tool call(s): " + toolDesc);
        }
        const incomplete = this.incompleteMessages();
        if (incomplete.length > 0) {
            const types = incomplete.map(m => (typeof m.svType === "function" ? m.svType() : "message"));
            reasons.push(incomplete.length + " incomplete message(s): " + types.join(", "));
        }
        if (reasons.length === 0) {
            // acceptsChatInput() is false but neither known gate explains it —
            // itself a useful signal (a subclass override or an unaccounted gate).
            return "input gated but no blocking tool calls or incomplete messages found (check acceptsChatInput overrides)";
        }
        return reasons.join("; ");
    }

    /* --- Client State --- */


    /**
   * @description Gets the session state tag map.
   * @returns {Map} The session state tag map.
   * @category Session State
   */
    clientStateTagMap () {
        const m = new Map();
        m.set("client-state",       "{Content removed as it has been outdated. See client-state tag in the last message of the conversation for the latest client state.}");
        m.set("client-state-patch", "{Content removed as the patch is already applied. See client-state tag in the last message of the conversation for the latest client state.}");
        return m;
    }

    /**
   * @description Gets the session JSON. This gets inserted into the last message of the conversation. Note: session JSON gets removed from all but the last message.
   * @returns {Object|null} The session JSON or null.
   * @category Session State
   */
    clientStateJson () {
        const delegate = this.assistedObject();
        if (delegate) {
            return delegate.serializeToJsonString(null, []);
        }
        return null;
    }

    /**
   * @description Gets the client state schema.
   * @returns {String} The client state schema.
   * @category Client State
   */
    clientStateJsonSchema () {
        const delegate = this.assistedObject();
        if (delegate) {
            return delegate.asRootJsonSchemaString();
        }
        return null;
    }

    // --- history filing (pushHistory tool) ---

    /**
   * @description Tool: files the settled unfiled buffer as one titled history
   * episode. Copies (not moves) — the original message nodes stay in the
   * conversation untouched (the user's transcript keeps showing everything);
   * they just gain a filedToHistoryBlockId marker that the AI-visible
   * composition collapses to the block's handle marker once a newer block
   * supersedes it (see composeJsonHistory).
   * @param {SvToolCall} toolCall
   * @category History
   */
    pushHistory (toolCall) {
        try {
            const title = toolCall.parametersDict().title;
            const subtitle = toolCall.parametersDict().subtitle;
            if (!Type.isString(title) || title.trim().length === 0) {
                throw new Error("pushHistory: a non-empty title is required");
            }

            const candidates = [];
            for (const m of this.messages()) {
                if (m.role() === "system") {
                    continue; // the system prompt is not part of any episode
                }
                if (m.filedToHistoryBlockId && m.filedToHistoryBlockId()) {
                    continue; // already filed in an earlier push
                }
                if (!m.isVisibleToAi || !m.isVisibleToAi()) {
                    continue; // private/UI-only (e.g. party chat) — never copy into AI-queryable history
                }
                if (!m.isComplete() && !m.hasError()) {
                    break; // unsettled — stop here so filed blocks stay contiguous
                }
                candidates.push(m);
            }

            if (candidates.length === 0) {
                throw new Error("pushHistory: nothing to file — no settled messages since the last push");
            }

            const block = this.history().newBlockWithTitleAndSubtitle(title, subtitle);
            candidates.forEach(m => {
                block.addCopyOfMessage(m);
                m.setFiledToHistoryBlockId(block.jsonId());
            });
            console.log(this.logPrefix(), "pushHistory filed " + candidates.length + " messages as '" + title + "' (" + block.jsonId() + ")");
            toolCall.setCallResult(null);
        } catch (error) {
            toolCall.setCallError(error);
        }
    }

    /**
   * @description Composes the AI-visible json history from message nodes,
   * collapsing filed episodes: messages filed to a superseded block emit
   * nothing individually — one handle-dict marker per block appears in their
   * place. The NEWEST filed block stays inline (one-episode lookback), so
   * {current buffer + previous episode} is always in full view. Markers are
   * regenerated from block state on every pass — nothing marker-shaped is
   * stored.
   *
   * options.collapseNewestBlock (default false): suspend the lookback and
   * collapse the newest filed block to its marker too — the context-pressure
   * escape valve (a fresh push normally reclaims no tokens because the new
   * block stays inline; near the context limit that luxury is suspended so
   * filing gives immediate relief).
   * @param {Array} messages - The visible message nodes, in order.
   * @param {Object} [options]
   * @returns {Array} Array of {role, content} dicts for the request.
   * @category History
   */
    composeJsonHistory (messages, options = {}) {
        const history = this.history();
        const newestBlock = (history && history.newestBlock) ? history.newestBlock() : null;
        if (!newestBlock) {
            return messages.map(m => m.messagesJson()); // nothing filed yet
        }
        const inlineBlockId = options.collapseNewestBlock ? null : newestBlock.jsonId();
        const emittedBlockIds = new Set();
        const out = [];
        messages.forEach(m => {
            const blockId = (m.filedToHistoryBlockId ? m.filedToHistoryBlockId() : null);
            if (blockId && blockId !== inlineBlockId) {
                if (!emittedBlockIds.has(blockId)) {
                    emittedBlockIds.add(blockId);
                    const block = history.blockWithJsonId(blockId);
                    if (block) {
                        out.push(this.historyMarkerJsonForBlock(block));
                    }
                }
                return; // superseded episode — collapsed into its marker
            }
            out.push(m.messagesJson());
        });
        return out;
    }

    /**
   * @description Count of AI-visible, settled, non-system messages not yet
   * filed to a history block — the unfiled backlog that filing reminders
   * key on.
   * @returns {Number}
   * @category History
   */
    unfiledSettledMessageCount () {
        return this.messages().filter(m =>
            m.role() !== "system"
            && (m.isVisibleToAi ? m.isVisibleToAi() : true)
            && (m.isComplete() || m.hasError())
            && !(m.filedToHistoryBlockId && m.filedToHistoryBlockId())
        ).length;
    }

    /**
   * @description Minimum unfiled backlog before historyFilingReminderIfNeeded
   * speaks up — below this, the live buffer is presumed to be one scene.
   * @returns {Number}
   * @category History
   */
    historyFilingReminderFloor () {
        return 6;
    }

    /**
   * @description An advisory filing reminder when the unfiled backlog
   * warrants one, else null. Designed for tool definitions'
   * resultReminderMethodName (see Function_ideal) — attach it to the result
   * of a tool call that marks an episode boundary (e.g. a view/state query
   * made on a scene change), so the reminder arrives at exactly the moment
   * the AI should file.
   * @returns {string|null}
   * @category History
   */
    historyFilingReminderIfNeeded () {
        const count = this.unfiledSettledMessageCount();
        if (count < this.historyFilingReminderFloor()) {
            return null;
        }
        return "REMINDER: " + count + " settled messages are not yet filed to history. If your latest actions closed out one or more episodes, file each completed episode now with pushHistory (title + subtitle). If nothing has concluded yet, continue normally.";
    }

    /**
   * @description The {role, content} dict marking a filed episode in the
   * AI-visible history: the block's lens handle (jsonId, title, subtitle,
   * count) wrapped in a history-record tag. Expanding it back is an ordinary
   * getClientState expand-by-id on the jsonId.
   * @param {SvAiConversationHistoryBlock} block
   * @returns {Object}
   * @category History
   */
    historyMarkerJsonForBlock (block) {
        const roleName = this.service() ? this.service().serviceRoleNameForRole("user") : "user";
        const content = "<history-record>\n" + JSON.stableStringifyWithStdOptions(block.lensHandleJson(), null, 2) + "\n</history-record>";
        return { role: roleName, content: content };
    }

    /**
   * @description Filters the JSON history of messages by each tool's declared
   * RESULT RETENTION POLICY (Function_ideal: setResultRetentionPolicy on the
   * tool method; read via the tool definition):
   *
   *   "keep" (default)   — results are never stripped (events: rolls, images).
   *   "keep-newest-only" — only the newest result survives, at ANY age
   *                        (complete-view snapshots — older ones are redundant
   *                        and, post-patches, potentially contradictory; the
   *                        newest survives forever so the AI is never stateless).
   *   "recent-window:N"  — results older than the last N messages are stripped
   *                        (recent errors matter, old successes don't; keep N
   *                        small so the rewritten region stays confined to the
   *                        tail for the prompt cache).
   *
   * Stripping replaces json.result with the tool's setResultRetentionNote (or
   * a generic note); the CALL stays visible in the assistant text, so what
   * happened is never lost — only the payload.
   * @param {Array} messages - The messages to filter.
   * @returns {Array} The filtered messages.
   * @category Session State
   */
    onFilterJsonHistory (messages) {
        const toolDefinitions = this.assistantToolKit() ? this.assistantToolKit().toolDefinitions() : null;
        if (!toolDefinitions) {
            return messages;
        }
        const seenNewestOfTool = new Set();
        for (let index = messages.length - 1; index >= 1; index--) { // skip index 0 (may be a system message)
            const m = messages[index];
            m.content = m.content.mapContentOfTagsWithName("tool-call-result", (content) => {
                let resultJson;
                try {
                    resultJson = JSON.parse(content);
                } catch (parseError) { // eslint-disable-line no-unused-vars
                    return content; // not a JSON result payload — leave it alone
                }
                const toolName = resultJson ? resultJson.toolName : null;
                if (!toolName) {
                    return content;
                }
                const toolDef = toolDefinitions.toolDefinitionWithName(toolName);
                const policy = (toolDef && toolDef.resultRetentionPolicy) ? toolDef.resultRetentionPolicy() : "keep";
                if (!policy || policy === "keep") {
                    return content;
                }
                if (policy === "keep-newest-only") {
                    if (!seenNewestOfTool.has(toolName)) {
                        seenNewestOfTool.add(toolName); // newest survives, whatever its age
                        return content;
                    }
                } else if (policy.startsWith("recent-window:")) {
                    const windowSize = parseInt(policy.split(":")[1], 10);
                    if (!(windowSize > 0)) {
                        console.warn(this.logPrefix(), "invalid recent-window retention policy '" + policy + "' on tool '" + toolName + "' — keeping result");
                        return content;
                    }
                    if (index >= messages.length - windowSize) {
                        return content; // still within the window
                    }
                } else {
                    console.warn(this.logPrefix(), "unknown result retention policy '" + policy + "' on tool '" + toolName + "' — keeping result");
                    return content;
                }
                const note = (toolDef && toolDef.resultRetentionNote && toolDef.resultRetentionNote())
                    || "result removed to save tokens (results of this tool are retained only briefly; call it again if needed)";
                resultJson.result = note;
                return JSON.stableStringifyWithStdOptions(resultJson, null, 2);
            });
        }
        return messages;
    }

    /*
  const schemaString = JSON.stableStringifyWithStdOptions(schema, null, 2);
  const jsonString = JSON.stableStringifyWithStdOptions(json, null, 2);
*/

    // --- tool calls ---

    onStream_toolCall_TagText (innerTagString, aMessage) { // sent by SvAiParsedResponseMessage
        assert(aMessage);
        this.assistantToolKit().handleToolCallTagFromMessage(innerTagString, aMessage);
    }

    /**
     * @description Handles a tool-call tag found inside an ignored block (e.g.
     * <think>) — sent by SvAiParsedResponseMessage at message completion. The
     * call is never executed; it either settles as an error the AI can react
     * to, or attaches a warning to the registered duplicate. See
     * SvToolCalls.handleOrphanedToolCallTagFromMessage.
     * @param {string} innerTagString - The tool call JSON string.
     * @param {SvAiResponseMessage} aMessage - The message the tag was found in.
     * @param {string} contextTagName - The ignored ancestor tag name (e.g. "think").
     * @category Tool Calls
     */
    onOrphanedToolCallTag (innerTagString, aMessage, contextTagName) {
        assert(aMessage);
        // Mirror/client conversations never drive tool calls locally
        if (typeof this.shouldProcessToolCalls === "function" && !this.shouldProcessToolCalls()) {
            return;
        }
        this.assistantToolKit().handleOrphanedToolCallTagFromMessage(innerTagString, aMessage, contextTagName);
    }

    assertNoUncompletedBlockingToolCalls () {
        const tk = this.assistantToolKit();
        if (tk) {
            if (tk.hasUncompletedBlockingToolCalls()) {
                let blockingCalls = tk.blockingCalls();
                const blockingCallsString = blockingCalls.map(c => c.toolDefinition().name()).join(", ");
                console.error("**ERROR**:", this.logPrefix(), "assertNoUncompletedBlockingToolCalls() called when there are uncompleted blocking tool calls: " + blockingCallsString);
                //debugger;
                tk.hasUncompletedBlockingToolCalls();
            }
        }

    }

    addSubnode (subnode) {
        if (subnode.isKindOf(SvAiResponseMessage)) {
            this.assertNoUncompletedBlockingToolCalls();
        }
        super.addSubnode(subnode);
    }

}.initThisClass());
