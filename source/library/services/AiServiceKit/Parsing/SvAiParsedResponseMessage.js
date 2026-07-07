"use strict";

/**

    @class SvAiParsedResponseMessage
    @extends SvAiResponseMessage
    @description A class for parsing AI response messages.

*/

(class SvAiParsedResponseMessage extends SvAiResponseMessage {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("hasProcessed", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
            slot.setIsInCloudJson(true);
        }

        // -- actions ---

        {
            const slot = this.newSlot("handleEmbeddedRequestsAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Handle Embedded Requests");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setCanInspect(true);
            slot.setActionMethodName("handleEmbeddedRequests");
        }
        // ----------------------------------

        {
            const slot = this.newSlot("aiErrors", null);
            slot.setDescription("array of strings (we use strings so we can persist them");
            slot.setSlotType("Array");
        }

        {
            /*
            When tags containg a dash (e.g. "tool-call") are found in the content,
            we can delegate to this object to handle them object is set to this by default,
            but can be set to another object if needed.

            Called while streaming:

            onStream_TagName_TagText // sent if tagDelegate responds to it
            onStream_TagName_TagJson // sent if tagDelegate responds to it. Will parse the json and send the result.

            Called when message is complete:

            onComplete_TagName_TagText
            onComplete_TagName_TagJson

            Notes:
            - TagName is the camelCase version of the tag name. e.g. "session-name" becomes "sessionName"
            - The delegate should probably only implement one or the other of these methods, not both.
        */

            const slot = this.newSlot("tagDelegate", null); // if null on the instance, we return the instance itself
            slot.setSlotType("Object");
        }

        // ------------------------------

        // --- streaming ---
        // streaming slots (htmlStreamReader, processStreamContentAction) are declared
        // by the SvAiParsedResponseMessage_streaming category via initPrototypeSlots_streaming

        // --- voice narration ---

        {
            const slot = this.newSlot("isDoneSpeaking", false);
            slot.setCanInspect(true);
            slot.setDuplicateOp("duplicate");
            slot.setInspectorPath(this.svType());
            slot.setLabel("Is Done Speaking");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(false);
            slot.setIsInCloudJson(true);
        }
    }

    initPrototype () {
        this.setNodeTileClassName("UoChatInputTile");
        this.setCanDelete(false);
    }

    init () {
        super.init();
        this.setAiErrors([]);
    }

    isVisible () {
        const devMode = SvApp.shared().developerMode();
        const isVisibleToUser = this.isVisibleToUser();

        if (devMode) {
            return true;
        }
        return isVisibleToUser && super.isVisible() && (this.role() !== "system" /*|| SvApp.shared().developerMode() */);
    }

    tagDelegate () {
    // return the conversation's tagDelegate if it has one
        const conversation = this.conversation();
        if (conversation && conversation.respondsTo("tagDelegate")) {
            const conversationDelegate = conversation.tagDelegate();
            if (conversationDelegate) {
                return conversationDelegate;
            }
        }

        // if null, set the default local delegate to this object
        if (this._tagDelegate === null) {
            this._tagDelegate = this;
        }

        // return the delegate
        return this._tagDelegate;
    }

    // --- sharing changes ---

    onRequestComplete (aRequest) {
        super.onRequestComplete(aRequest);
        this.setIsComplete(true);
    }

    // --- triming content for history shown to ai ---

    contentVisisbleToAi () {
        return this.content();
    }

    setContent (s) {
        super.setContent(s);
        return this;
    }

    updateContent (html) {
        this.setContent(html);
        this.sendDelegateMessage("onMessageUpdate");
        return this;
    }

    // --- handling embedded requests inside content ---

    handleEmbeddedRequestsIfNeeded () {
        if (!this.hasProcessed()) {
            this.handleEmbeddedRequests();
        }
        return this;
    }

    handleEmbeddedRequests () {
        // this should be transactional within the calling event
        try {
            this.justHandleEmbeddedRequests();
        } catch (e) {
            console.warn(this.svType() + ".handleEmbeddedRequests() ERROR: " + e.message + " =======");
            if (e.message.startsWith("AI ERROR:")) {
                this.addAiError(e.message);
            }
        }

        this.setHasProcessed(true);
        this.handleAiErrors();
        return this;
    }

    justHandleEmbeddedRequests () {
        this.handleNodeTags();
    }

    // --- ai errors ---

    handleAiErrors () {
    // TODO: implement
        const errorMessages = this.aiErrors();
        if (errorMessages.length) {
            this.setError(new Error(errorMessages.join("\n")));
        }
        return this;
    }

    addAiError (errorMessage) {
        console.warn(errorMessage);
        this.aiErrors().push(errorMessage);
        return this;
    }

    // --- tag delegate methods ---

    sendStreamTag (tagName, tagText) {
        this.promiseSendDelegateTag("Stream", tagName, tagText);
    }

    sendCompleteTag (tagName, tagText) {
        this.promiseSendDelegateTag("Complete", tagName, tagText);
    }

    async promiseSendDelegateTag (phase, tagName, tagText) {
        const ignoreMissingMethodsForTags = ["narration-progress", "session-name"];
        // phase is "Stream" or "Complete"
        // note: need to be careful about async here. We use it do deal with json tags errors as
        // we make follow up network requests repair them, but some things need to be synchronous,
        // such as updating the session, character sheet, or voice narration...
        // text tags
        const textMethodName = "on" + phase + "_" + this.convertTagToCamelCase(tagName) + "_TagText";
        if (this.tagDelegate().respondsTo(textMethodName)) {
            console.log("tagDelegate calling method: " + textMethodName);
            // One catch site covers every tag handler (app delegates included):
            // without it a handler exception becomes an unhandled promise
            // rejection (this call is not awaited by the parser) and the AI
            // continues on a false premise.
            try {
                return await this.tagDelegate()[textMethodName](tagText, this);
            } catch (error) {
                console.error(this.svType() + ".promiseSendDelegateTag() " + textMethodName + " threw:", error);
                this.reportRuntimeError(error, {
                    tag: tagName,
                    phase: phase.toLowerCase(),
                    excerpt: String(tagText).clipWithEllipsis(200)
                });
                return undefined;
            }
        } else if (tagName.includes("-")) { // only warn if it has a dash as it's a special tag
            if (ignoreMissingMethodsForTags.includes(tagName)) {
                // we can ignore missing methods for this tag
            } else {
                // otherwise, we need to report an error
                if (tagName === "tool-call-result") {
                    // if the the tag is a tool-call-result, let's compose a special error message
                    // to remind the ai that tool call results can only be returned by the tool call itself.
                    const errorMessage = `You have mistakenly responded with a tool-call-result tag. 
            Tool call results can only be returned by the tool call itself. `;
                    const extraNote = this.noteForToolJsonString(tagText);
                    this.reportErrorToAi("Error: " + errorMessage + extraNote);
                    return;
                } else {
                    console.warn("tagDelegate (" + this.tagDelegate().svType() + ") missing method: " + textMethodName + " for tag: " + tagName);
                    let errorMessage = "Error: you responded with a '" + tagName + "' tag which the client does not understand. ";
                    errorMessage += "If you have sent the tool call for which this was the result, then ignore your own response and wait from the tool-call-result from the client user response. ";
                    errorMessage += "Critical: you MUST NOT make use of <tool-call-result> tag in your response.";
                    this.reportErrorToAi(errorMessage);
                }
            }
        }
    }

    noteForToolJsonString (jsonString) {
        let note = "";
        let json = null;
        try {
            json = JSON.parse(jsonString);
        } catch (error) {
            if (error) {
            // just here to keep the linter happy
            }
            return "";
        }
        const toolName = json.toolName;
        if (!toolName) {
            return "";
        }
        const toolDefinition = this.conversation().assistantToolKit().toolCalls().toolDefinitionWithName(toolName);
        if (toolDefinition) {
            const schema = toolDefinition.toolJsonDescription(new Set());
            const schemaString = JSON.stringify(schema, null, 2);
            note = "Note: the tool definition for the '" + toolName + "' tool is: " + schemaString;
        } else {
            note = "Note: the tool call with name '" + toolName + "' was not found. Please check the system prompt for the list of available tool calls.";
        }
        return note;
    }

    /**
     * @description Queues a runtime event report for an error the engine hit
     * while handling this response. Delivery is deferred to the tool kit's
     * send gate (after the current response settles), coalesced with any
     * pending tool results — safe to call from inside a streaming callback.
     * @param {Error} error
     * @param {Object} [info] - occurrence/attribution fields (tag, phase, excerpt, source, ...)
     * @category Error Handling
     */
    reportRuntimeError (error, info = {}) {
        const conversation = this.conversation();
        if (conversation && conversation.assistantToolKit) {
            conversation.assistantToolKit().addRuntimeError(error, info);
        } else {
            console.warn(this.svType() + ".reportRuntimeError() no assistantToolKit to report to — dropping: " + (error && error.message));
        }
    }

    reportErrorToAi (errorMessage) {
        // legacy name — now rides the runtime event report queue instead of
        // creating an invisible message immediately (which was ungated and
        // uncoalesced: it fired mid-stream while a response was still active)
        console.warn(this.svType() + ".reportErrorToAi(\"" + errorMessage + "\")");
        this.reportRuntimeError(new Error(errorMessage), { source: "responseTagHandling" });
    }

    // ----------------------------------------------------------------

    handleNodeTags () {
        const orphanedToolCallTags = [];
        this.content().walkDom((node) => {
            const tagName = node.tagName;
            if (tagName) { // text nodes don't have tag names
                const parentTagNames = Element_getAllParentNodes(node).map((n) => n.tagName);
                const shouldHandle = tagName.includes("-");
                const shouldIgnore = this.tagsToIgnoreInsideSet().intersection(new Set(parentTagNames)).size > 0;

                // DOM tagNames are uppercase, so match ignored ancestors
                // case-insensitively (the shouldIgnore intersection above
                // predates this and is left as-is)
                const ignoredAncestor = parentTagNames
                    .map((n) => String(n).toLowerCase())
                    .find((n) => this.tagsToIgnoreInsideSet().has(n));

                if (tagName.toLowerCase() === "tool-call" && ignoredAncestor) {
                    // A tool call inside <think>/<scene-description> is never
                    // executed, but silently dropping it leaves the AI waiting
                    // forever on a call that was never registered. Collect it
                    // and report it back after the walk (after the walk so
                    // top-level copies of the same call register first and
                    // duplicates can be detected).
                    orphanedToolCallTags.push({ tagText: node.textContent, contextTagName: ignoredAncestor });
                } else if (shouldHandle && !shouldIgnore) {
                    const text = node.textContent;
                    this.sendCompleteTag(tagName, text);
                }
            }
        });

        orphanedToolCallTags.forEach((orphan) => {
            const delegate = this.tagDelegate();
            if (delegate && delegate.respondsTo("onOrphanedToolCallTag")) {
                delegate.onOrphanedToolCallTag(orphan.tagText, this, orphan.contextTagName);
            } else {
                console.warn(this.svType() + ".handleNodeTags() found a tool-call inside <" + orphan.contextTagName + "> but the tag delegate doesn't respond to onOrphanedToolCallTag");
            }
        });
    }

    // --- helpers to get bits of tagged content ---

    requestTags () {
        return [
            // tool calls
            {
                "tagName": "tool-call",
                "shouldSpeak": false
            }
        ];
    }

    unspeakableTagNames () { // don't speak these
        if (!this._unspeakableTagNames) {
            this._unspeakableTagNames = this.requestTags().select(tag => tag.shouldSpeak === false).map(tag => tag.tagName);
        }
        return this._unspeakableTagNames;
    }

}).initThisClass();

