"use strict";

/* 
    AiResponseMessage

*/

(class AiResponseMessage extends AiMessage {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("request", null);
      slot.setLabel("request")
      slot.setShouldStoreSlot(false)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Pointer")
      slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("requestClass", null);
      slot.setLabel("Request Class")
      slot.setShouldStoreSlot(false)
      slot.setDuplicateOp("duplicate")
      slot.setCanInspect(false)
    }

    {
      const slot = this.newSlot("isResponse", false);
      slot.setSlotType("Boolean")
      slot.setShouldStoreSlot(true)
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
    }

    {
      const slot = this.newSlot("retryCount", 0);
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");

      //slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("summaryMessage", null);
      slot.setSlotType("String");
      slot.setInspectorPath(this.type());
      //slot.setShouldStoreSlot(true)
    }

    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("temperature", 0.7); // 0-1, higher = more creative
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true)
    }

    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("topP", 0.8); // 0-1, higher = more diverse // top_p on Claude3
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("completionPromise", null);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true);
    this.setIsVisibleToAi(true);
    this.setRole("assistant");

    this.setRequestClass(AiRequest); // subclasses should set this
  }

  finalInit () {
    super.finalInit();
    this.setCompletionPromise(Promise.clone());
    if (this.isComplete()) {
      this.completionPromise().callResolveFunc();
    }
  }

  requestClass () {
    const node = this.firstParentChainNodeThatRespondsTo("chatRequestClass");
    return node.chatRequestClass();
  }

  isResponse () {
    return true;
  }

  /*
  finalInit () {
    super.finalInit();
  }
  */

  valueIsEditable () {
    return false;
  }

  aiSpeakerName () {
    return "OpenAI"
  }

  send () {
    throw new Error("shouldn't call send on a response");
    // NOTE: things like system messages for prompt are not response messages, so we can send them
  }

  requestResponse () {
    throw new Error("shouldn't call requestResponse on a response");
  }

  // --- send request -------------

  chatModel () {
    return this.conversation().chatModel()
  }

  service () {
    return this.conversation().service()
  }

  apiKey () {
    return this.service().apiKey()
  }

  // --- make a request --- 

  /*
  assertValidRequest () {
    assert(this.validRoles().includes(this.role()))
  }
  */

  makeRequest () {
    this.setError(null);
    const request = this.newRequest();
    this.setRequest(request);
    request.asyncSendAndStreamResponse();
    return this
  }

  newRequest () {
    const messages = this.visiblePreviousMessages(); 
    const jsonHistory = messages.map(m => m.messagesJson());

    const lines = [];
    messages.forEach((m, i) => { 
      const v = m.isVisibleToAi() ? "V" : "X";
      const parts = [i, v, m.type(), m.role()];
      const size = Math.floor(m.content().length/1000) + " k";
      let description = ""
      if (m.reason) {
        description = m.reason() 
      }

      if (m.content().length < 500) {
        description = '"' + m.content() + '"';
      }

      parts.push(description);

      if (m.content().length > 500) {
        parts.push("(" + size + ")");
      }

      const line = parts.join(" ");
      lines.push(line);
    });

    //console.log(this.type() + ".newRequest() history:"); 
    //console.log(lines.join("\n"));
    //debugger;
    this.visiblePreviousMessages(); // TODO : REMOVE AFTER DEBUGGING

    const request = this.requestClass().clone();
    request.setService(this.service());

    request.setDelegate(this);
    //request.setStreamTarget(this); // unify with delegate

    request.setBodyJson({
      model: this.chatModel().modelName(),
      temperature: this.temperature(), 
      top_p: this.topP(),
      messages: jsonHistory
    });
    return request;
  }

  showRequestInfo () {

  }

  visiblePreviousMessages () {
    // give conversation a chance to control this
    // which may be useful for summaries
    const messages = this.conversation().aiVisibleHistoryForResponse(this); 
    return messages;
  }

  // --- handle request delegate messages ---

  onRequestBegin (aRequest) {

  }

  onRequestError (aRequest) {
    console.log("ERROR: ", aRequest.error().message);
    this.setError(aRequest.error());
    const msg = aRequest.error().message;
    /*
    if (msg.includes("Please try again in 6ms.")) {
      this.setRetryCount(this.retryCount() + 1);
      const seconds = Math.pow(2, this.retryCount());
      console.warn("WARNING: retrying openai request in " + seconds + " seconds");
      this.addTimeout(() => this.makeRequest(), seconds*1000);
    }
    */
  }

  valueError () {
    const e = this.error();
    return e ? e.message : null;
  }

  onComplete () {
    super.onComplete() // sends a delegate message
    this.completionPromise().callResolveFunc();
    // to be overridden by subclasses
  }

  onRequestComplete (aRequest) {
    //this.setRequest(null)
    //this.setStatus("complete")
    this.setIsComplete(true);
    this.sendDelegate("onMessageComplete");
  }

  // --- response tag ---

  beginsWithResponseTag () {
    return this.fullContent().startsWith("<response>");
  }

  endsWithResponseTag () {
    return this.fullContent().endsWith("</response>");
  }

  // --- stream target events ---

  onStreamStart (request) {
  }
  
  onStreamData (request, newContent) {
    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
  }
  
  onStreamEnd (request) {
    //this.setContent(request.fullContent()); // all data has already been sent
    this.setIsComplete(true);
    this.sendDelegate("onMessageUpdate");
  }

  onValueInput () {
    this.requestResponse();
  }

  shutdown () {
    if (this.request()) {
      this.request().shutdown();
      this.setRequest(null);
    }
  }

  delete () {
    this.shutdown();
    return super.delete();
  }

}.initThisClass());
