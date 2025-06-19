"use strict";

/*

    AiParsedResponseMessage

*/

(class AiParsedResponseMessage extends AiResponseMessage {

  initPrototypeSlots () {
    {
      const slot = this.newSlot("hasProcessed", false);
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
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
         When tags containg a dash (e.g. "session-name") are found in the content, 
         we can delegate to this object to handle them object is set to this by default, 
         but can be set to another object if needed.

        Called while streaming:

          onStream_TagName_TagText // sent if tagDelegate responds to it
          onStream_TagName_TagJson // sent if tagDelegate responds to it. Will parse the json and send the result.
          
        Called when message is complete:

          onComplete_TagName_TagText
          onComplete_TagName_TagJson

        Note: TagName is the camelCase version of the tag name. e.g. "session-name" becomes "sessionName"
      
       NOTE: the delegate should probably only implement one or the other of these methods, not both.
   
      */

      const slot = this.newSlot("tagDelegate", null); // if null on the instance, we return the instance itself
      slot.setSlotType("Object");
    }

    // ------------------------------

    // --- streaming ---

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

    // ------------------------------

    // --- voice narration ---
    
    {
      const slot = this.newSlot("isDoneSpeaking", false);
      slot.setCanInspect(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath(this.type());
      slot.setLabel("Is Done Speaking");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(false);      
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
    //debugger;
    return super.isVisible() && (this.role() !== "system" /*|| this.session().settings().developerMode()*/);
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
    this.sendDelegate("onMessageUpdate");
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
      console.warn(
        this.type() +
          ".handleEmbeddedRequests() ERROR: " +
          e.message +
          " ================================"
      );
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
    const ignoreMissingMethodsForTags = ["narration-progress", "content-warning", "session-name"];
    // phase is "Stream" or "Complete"
    // note: need to be careful about async here. We use it do deal with json tags errors as
    // we make follow up network requests repair them, but some things need to be synchronous, 
    // such as updating the session, character sheet, or voice narration...
    // text tags
    const textMethodName = "on" + phase + "_" + this.convertTagToCamelCase(tagName) + "_TagText";
    if (this.tagDelegate().respondsTo(textMethodName)) {
      console.warn("tagDelegate calling method: " + textMethodName);
      return this.tagDelegate()[textMethodName](tagText, this);
    } else if (tagName.includes("-")) { // only warn if it has a dash as it's a special tag
      if (!ignoreMissingMethodsForTags.includes(tagName)) {
        if (tagName === "tool-call-result") {
          console.warn("AI is mistakingly sending a tool-call-result tag. This is not allowed. Ignoring.");
          // TODO: add a feature to attach a error message about this to the next user response message
          // maybe via the tool call result object?
          debugger;
          return;
        }
        console.warn("tagDelegate (" + this.tagDelegate().type() + ") missing method: " + textMethodName + " for tag: " + tagName);
        debugger;
      }
    }

  }

  // ----------------------------------------------------------------
  
  handleNodeTags () {
    this.content().walkDom((node) => {
      const tagName = node.tagName;
      if (tagName) { // text nodes don't have tag names
        const parentTagNames = Element_getAllParentNodes(node).map((n) => n.tagName);
        const shouldHandle = tagName.includes("-");
        const shouldIgnore = this.tagsToIgnoreInsideSet().intersection(new Set(parentTagNames)).size > 0;
        if (shouldHandle && !shouldIgnore) {
          const text = node.textContent;
          this.sendCompleteTag(tagName, text);
        }
      }
    });
  }

  // --- helpers to get bits of tagged content ---

  requestTags () {
    return [
      // music
      {
        "tagName": "music-track-play",
        "isIncremental": true,
        "shouldSpeak": false
      },
      {
        "tagName": "music-track-stop",
        "isIncremental": true,
        "isJson": false,
        "shouldSpeak": false
      },

      // rolls
      {
        "tagName": "roll-request",
        "isIncremental": false,
        "shouldSpeak": false
      },

      // images
      {
        "tagName": "scene-description",
        "isIncremental": false,
        "shouldSpeak": false
      },

      // sound fx
      {
        "tagName": "sound-effect-play",
        "isIncremental": true,
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

  /*
  nonIncrementalRequestTypes () {
    if (!this._nonIncrementalRequestTypes) {
      this._nonIncrementalRequestTypes = this.requestTags().select(tag => tag.isIncremental === false).map(tag => tag.tagName);
    }
    return this._nonIncrementalRequestTypes 
  }

  incrementalSafeRequestTypes () {
    if (!this._incrementalSafeRequestTypes) {
      this._incrementalSafeRequestTypes = this.requestTags().select(tag => tag.isIncremental === true).map(tag => tag.tagName);
    }
    return this._incrementalSafeRequestTypes;
  }
  */

}).initThisClass();


