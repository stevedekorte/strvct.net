"use strict";

/*

    AiParsedResponseMessage_streaming

*/


(class AiParsedResponseMessage_streaming extends AiParsedResponseMessage {

  initPrototypeSlots_streaming () {
    //debugger;
    // --- streaming ---

    /*
    {
      const slot = this.newSlot("htmlStreamReader", null);
      slot.setSlotType("HtmlStreamReader");
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
      */

  }

  setupHtmlStreamReader () {
    this.setHtmlStreamReader(HtmlStreamReader.clone().setDelegate(this));
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
    
    //super.onStreamEnd(request);
    if (this.htmlStreamReader()) {
      // if there was an error, have we already shutdown the reader?
      this.htmlStreamReader().endHtmlStream();
    }
    //console.log("onStreamEnd request.fullContent() = [" + request.fullContent() + "]");
    //this.updateContent(request.fullContent())
    this.sendDelegate("onMessageUpdate");
    this.shutdownSentenceReader();
  }

  // --- HtmlStreamReader delegate methods ---

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

      const shouldIgnore = streamNode.detectAncestor(node => this.tagsToIgnoreInsideSet().has(node.name()));;
      //this.postNoteNamed("onHtmlStreamReaderPopNodeNote").setInfo({ tagName: nodeTag, textContent: streamNode.textContent() }); // clear any progress notes

      // NOTE: some of these are handled incrementally, some are not.
      // Generally, we want to:
      // - process items which would add a Tile to the conversation after the message is complete (so they don't make narration difficult to read)
      // --- these include roll request and sheet updates
      // - proccess all other items incrementally? 
      // -- what if message doesn't complete and needs to be reprocessed? 
      //   This might make conflicting changes to the session state for sheet updates.

      if (shouldIgnore) {
        // ignore these
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
    //debugger;
    this.setIsComplete(false); // otherwise markAsComplete won't call delegate
    this.setupHtmlStreamReader();
    this.htmlStreamReader().beginHtmlStream();
    this.htmlStreamReader().onStreamHtml(this.content());
    this.htmlStreamReader().endHtmlStream();
    this.shutdownSentenceReader();
    //debugger;
    this.markAsComplete();
  }

}).initThisCategory();


