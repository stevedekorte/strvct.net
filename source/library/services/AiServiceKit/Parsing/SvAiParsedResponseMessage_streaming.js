"use strict";

/**
 * @class SvAiParsedResponseMessage_streaming
 * @extends SvAiParsedResponseMessage
 * @classdesc Streaming-response category of SvAiParsedResponseMessage — handles
 * incremental tag parsing and progressive UI updates as tokens arrive.
 */

(class SvAiParsedResponseMessage_streaming extends SvAiParsedResponseMessage {

    initPrototypeSlots_streaming () {

        // --- streaming ---
        // These were previously duplicated in SvAiParsedResponseMessage.initPrototypeSlots
        // because initThisCategory silently skipped category slot installation
        // (see Object_categorySupport). Now that the gate is fixed, they live here.

        {
            const slot = this.newSlot("htmlStreamReader", null);
            slot.setSlotType("SvHtmlStreamReader");
        }

        {
            const slot = this.newSlot("processStreamContentAction", null);
            slot.setInspectorPath("");
            slot.setCanInspect(true);
            slot.setLabel("Process Stream Content");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(false);
            slot.setActionMethodName("processStreamContent");
        }

    }

    setupHtmlStreamReader () {
        this.setHtmlStreamReader(SvHtmlStreamReader.clone().setDelegate(this));
        return this;
    }

    shutdownSentenceReader () {
        const reader = this.htmlStreamReader();
        if (reader) {
            reader.shutdown();
            this.setHtmlStreamReader(null);
        }
        return this;
    }

    // --- stream messages only handled on host ---

    onStreamStart (/*request*/) {
        //super.onStreamStart(request);
        this.setupHtmlStreamReader();
        this.htmlStreamReader().beginHtmlStream();
        this.setContent("");
        this._orphanedToolCallTags = [];
    }

    /**
     * @description Tool-call tags found inside ignored blocks (e.g. <think>)
     * during streaming — collected here and reported at stream end. Lazy plain
     * ivar (not a slot): transient per-stream parser state, like the reader.
     * @returns {Array} The collected orphaned tool call tag records.
     * @category Streaming
     */
    orphanedToolCallTags () {
        if (!this._orphanedToolCallTags) {
            this._orphanedToolCallTags = [];
        }
        return this._orphanedToolCallTags;
    }

    onStreamData (request, newContent) {
        //console.log("----------------------------------------------------------");
        //console.log("onStreamData('" + newContent + "')");
        this.htmlStreamReader().onStreamHtml(newContent);
        this.updateContent(this.htmlStreamReader().rootNode().innerHtml());
        //console.log("content: [[" + this.content() + "]]");
        //console.log("----------------------------------------------------------");
    }

    /*
    onStreamAbort (request) {

    }
    */

    onStreamEnd (request) {
        /*
        if (request.didAbort()) {
            // the response is likley incomplete and invalid, so we should not process the
            // content and should not send it to the AI
            return;
        }
        */

        if (request.error()) {
            this.addAiError("AI ERROR: " + request.error().message);
            return;
        }

        // CRITICAL: the HTML/sentence-stream finalization below can throw on
        // malformed or unclosed tags in the AI output — parser().end() closing
        // dangling elements, or a tag handler (sendStreamTag -> roll/sheet/image
        // processing) throwing as the last nodes pop. If it throws here, the
        // exception is swallowed by the delegate-dispatch event wrapper and
        // super.onStreamEnd() — which calls setIsComplete(true) — is never reached.
        // The message then stays permanently incomplete and the chat input is gated
        // forever (the "input dead after a response" wedge). Finalization cleanup
        // must NOT block completion: log any error and complete the message anyway.
        try {
            if (this.htmlStreamReader()) {
                this.htmlStreamReader().endHtmlStream();
            }
            this.shutdownSentenceReader();
        } catch (e) {
            console.error(this.logPrefix ? this.logPrefix() : "[SvAiParsedResponseMessage]",
                "onStreamEnd finalization threw — completing the message anyway so input doesn't wedge:",
                e && e.message, e && e.stack);
            try { this.shutdownSentenceReader(); } catch (shutdownError) { /* best effort */ } // eslint-disable-line no-unused-vars
            // the AI should hear its output was broken (malformed/unclosed
            // tags), not just the console — queued, so it rides the
            // settlement flush after super.onStreamEnd completes the message
            this.reportRuntimeError(e, { source: "streamFinalization" });
        }

        // Report tool calls that were emitted inside ignored blocks (e.g.
        // <think>) — never executed, but the AI must hear back (an error on
        // the orphan's own callId, or a warning on the registered duplicate)
        // or it waits forever on a call that never registered. Done after
        // finalization so all top-level calls have registered for dedup.
        try {
            this.orphanedToolCallTags().forEach((orphan) => {
                const delegate = this.tagDelegate();
                if (delegate && delegate.respondsTo("onOrphanedToolCallTag")) {
                    delegate.onOrphanedToolCallTag(orphan.tagText, this, orphan.contextTagName);
                } else {
                    console.warn(this.svType() + ".onStreamEnd() found a tool-call inside <" + orphan.contextTagName + "> but the tag delegate doesn't respond to onOrphanedToolCallTag");
                }
            });
            this._orphanedToolCallTags = [];
        } catch (e) {
            console.error(this.logPrefix ? this.logPrefix() : "[SvAiParsedResponseMessage]",
                "orphaned tool-call reporting threw — completing the message anyway:", e && e.message);
        }

        super.onStreamEnd(request);
    }

    // --- SvHtmlStreamReader delegate methods ---

    onHtmlStreamReaderStart (/*reader*/) {
    // ...
    }

    onHtmlStreamReaderEnd (reader) {
        const html = reader.rootNode().innerHtml();
        this.updateContent(html);
    //this.postNoteNamed("onNarrationProgress").setInfo(""); // clear any progress notes
    }

    onHtmlStreamReaderPushNode (reader /*, streamNode*/) {
    //console.log("PUSH " + streamNode.description());
        const html = reader.rootNode().innerHtml();
        this.updateContent(html);
    }

    tagsToIgnoreInsideSet () {
        return new Set(["think", "scene-description"]);
    }

    onHtmlStreamReaderPopNode (reader, streamNode) {
    //if (!streamNode.isTextNode() && streamNode.attributes()["data-note"] === "speak") {

        if (!streamNode.isTextNode()) {
            //const html = reader.rootNode().asHtml();
            const nodeTag = streamNode.name().toLowerCase();
            const text = streamNode.textContent().trim();

            const ignoredAncestor = streamNode.detectAncestor(node => this.tagsToIgnoreInsideSet().has(node.name()));
            const shouldIgnore = ignoredAncestor;
            //this.postNoteNamed("onHtmlStreamReaderPopNodeNote").setInfo({ tagName: nodeTag, textContent: streamNode.textContent() }); // clear any progress notes

            // NOTE: some of these are handled incrementally, some are not.
            // Generally, we want to:
            // - process items which would add a SvTile to the conversation after the message is complete (so they don't make narration difficult to read)
            // --- these include roll request and sheet updates
            // - proccess all other items incrementally?
            // -- what if message doesn't complete and needs to be reprocessed?
            //   This might make conflicting changes to the session state for sheet updates.

            if (shouldIgnore) {
                if (nodeTag === "tool-call") {
                    // A tool call inside <think>/<scene-description> is never
                    // executed, but silently dropping it leaves the AI waiting
                    // forever on a call that never registered. Collect it and
                    // report at stream end (after any top-level copies of the
                    // same call have registered, so duplicates can be detected
                    // and warned instead of double-reported).
                    this.orphanedToolCallTags().push({
                        tagText: text,
                        contextTagName: ignoredAncestor.name()
                    });
                }
                // otherwise ignore these
            } else {
                this.sendStreamTag(nodeTag, text);
                /*
        if (nodeTag === "narration-progress") { // incremental safe
          // post a note that the ResponseMessageTile can use to control visibility of the progress notes
          this.postNoteNamed("onNarrationProgress").setInfo(streamNode.textContent());
          // if there is a watching tile, it should make this note visisble and hide all others within itself
        }
        */
            }

            this.updateContent(reader.rootNode().innerHtml()); // update so we can highlight the text when speaking

            if (
                this.shouldVoiceNarrate() &&
        this.tagsToSpeak().includes(nodeTag)
            ) {
                const speak = text; //this.spokenContentOfText(text); // no longer needed as we only speak tags which contain no subtags
                //console.log("speak: '" + speak.clipWithEllipsis(15) + "'");

                if (nodeTag !== "sentence") {
                    this.playTtsPauseMs(50); // pause for location name
                }

                this.voiceNarrateText(speak);

                if (nodeTag !== "sentence") {
                    this.playTtsPauseMs(15);
                }
                //console.log("onHtmlStreamReaderPopNode html = [" + html + "]");
            }
        }

    //console.log("POP " + streamNode.description());
    }

    // --- actions ---

    processStreamContentActionInfo () {
        const isComplete = this.isComplete();
        return {
            isEnabled: isComplete,
            title: "Process Stream Content",
            subtitle: isComplete ? "" : "(not finished streaming)",
            isVisible: true
        };
    }

    processStreamContent () { // see processStreamContent
        // TODO: add check if we are currently streaming repsonse and/or speaking
        this.setIsComplete(false); // otherwise markAsComplete won't call delegate
        this.setupHtmlStreamReader();
        this.htmlStreamReader().beginHtmlStream();
        this.htmlStreamReader().onStreamHtml(this.content());
        this.htmlStreamReader().endHtmlStream();
        this.shutdownSentenceReader();

        this.markAsComplete();
    }

}).initThisCategory();

