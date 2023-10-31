"use strict";

/* 
    OpenAiMessage

*/

(class OpenAiMessage extends ConversationMessage {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("role", "user"); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validRoles())
      //slot.setIsSubnodeField(true)
      slot.setCanInspect(true)

      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("request", null);
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(false)
      //slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Pointer")
      //slot.setIsSubnodeField(true)
      slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("isResponse", null);
      slot.setShouldStoreSlot(true)
      slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("isVisibleToAi", true);
      slot.setShouldStoreSlot(true)
      slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("retryCount", 0);
      //slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("summaryMessage", null);
      //slot.setShouldStoreSlot(true)
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit();
  }

  valueIsEditable () {
    return this.role() === "user"
  }

  aiSpeakerName () {
    return "OpenAI"
  }

  content () {
    return this.value()
  }

  setContent (s) {
    this.setValue(s)
    this.directDidUpdateNode()
    return this
  }

  subtitle () {
    let s = this.content()
    const max = 40
    if (s.length > max) {
      s = this.content().slice(0, max) + "..."
    }
    return this.role() + "\n" + s
  }

  tokenCount () {
    const s = this.content()
    if (s === null) {
      return 0
    }
    return Math.ceil(s.length / 4); // approximation
  }

  validRoles () {
    /* 
      system: high-level instructions to guide the model's behavior throughout the conversation. 
      user: role represents the user or the person initiating the conversation. You provide user messages or prompts in this role to instruct the model.
      assistant: role represents the AI model or the assistant. 
      The model generates responses in this role based on the user's prompts and the conversation history.
    */
   
    return [
      "system", 
      "user",
      "assistant" 
    ];
  }

  openAiJson () {
    return {
      role: this.role(),
      content: this.content()
    }
  }

  send () {
    return this.sendInConversation()
  }

  sendInConversation () {
    if (!this.request()) {
      const m = this.conversation().newMessage()
      m.setRole("assistant")
      //this.conversation().postShouldFocusSubnode(message)
      m.makeRequest()
      return m
    }
    return null
  }

  // --- send request -------------

  selectedModel () {
    return this.conversation().selectedModel()
  }

  service () {
    return this.conversation().service()
  }

  apiKey () {
    return this.service().apiKey()
  }

  // --- openai response request --- 

  /*
  assertValidRequest () {
    assert(this.validRoles().includes(this.role()))
  }
  */

  makeRequest () {
    this.setError(null)
    const request = this.newRequest()
    this.setRequest(request)
    //request.asyncSend();
    request.setStreamTarget(this)
    request.asyncSendAndStreamResponse()
    return this
  }

  newRequest () {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    request.setDelegate(this)
    request.setBodyJson({
      model: this.selectedModel(),
      messages: this.conversationHistoryPriorToSelfJson(),
      temperature: 0.7, // more creative
      top_p: 0.9 // more diverse
    });
    return request;
  }

  // --- request delegate messages ---

  onRequestBegin (aRequest) {
    this.setNote(this.centerDotsHtml())
  }

  onRequestError (aRequest) {
    this.setError(aRequest.error())
    const msg = aRequest.error().message
    if (msg.includes("Please try again in 6ms.")) {
      this.setRetryCount(this.retryCount() + 1)
      const seconds = Math.pow(2, this.retryCount());
      console.warn("WARNING: retrying openai request in " + seconds + " seconds");
      this.addTimeout(() => this.makeRequest(), seconds*1000);
    }
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onComplete () {
    // to be overridden by subclasses
  }

  onRequestComplete (aRequest) {
    //this.setRequest(null)
    //this.setStatus("complete")
    this.setNote(null)
    this.setIsComplete(true)
    this.sendDelegate("onMessageComplete")
  }
  
  onStreamData (request, newContent) {
    this.sendDelegate("onMessageWillUpdate")

    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
  }
  
  onStreamComplete (request) {
    this.setContent(request.fullContent())
    this.setIsComplete(true)
    this.sendDelegate("onMessageUpdate")
  }

  onValueInput () {
    this.sendInConversation()
  }

  cssVariableDict () {
    return {
      //"background-color": "var(--body-background-color)",
      //"color": "var(--body-color)",
      //"--body-background-color": "inherit"
    }
  }

  // --- summary ---

  newSummaryMessage () {
    const m = this.thisClass().clone()
    m.setRole("user")
    m.setContent(this.summaryRequestPrompt())
    m.setConversation(this.conversation())
    return m
  }

  sendSummaryMessage () {
    if (!this.summaryMessage()) {
      this.setNote("sending summary request")
      const m = this.newSummaryMessage()
      this.setSummaryMessage(m)
    }
  }

  summaryRequestPrompt () {
    return `Please write a concise summary of the previous chat history 
    which includes any details necessary to adequately continue the conversation 
    without the complete chat history. Start the summary with the title: "SUMMARY OF STORY SO FAR:"`
  }

  // --- json ---

  /*
  jsonArchive () {
    const json = super.jsonArchive()
    json.role = this.role()
    return json
  }

  setJsonArchive (json) {
    super.setJsonArchive(json)
    this.setRole(json.role)
    return this
  }
  */

}.initThisClass());
