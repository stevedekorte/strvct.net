"use strict";

/* 
    OpenAiMessage

*/

(class OpenAiMessage extends BMTextAreaField {
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
    }

    /*
    {
      const slot = this.newSlot("content", "");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanInspect(true)
    }
    */

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
      slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setCanInspect(true)
    }

    /*
    {
      const slot = this.newSlot("sendInConversation", null);
      slot.setInspectorPath("")
      slot.setLabel("Send")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("sendInConversation");
    }
    */


    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setValue("")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatFieldTile")
    this.setKeyIsVisible(true)
  }

  setSendInConversation (v) {
    debugger;
  }

  /*
  finalInit () {
    super.finalInit()
    //const action = BMActionField.clone().setTitle("Send").setTarget(this).setMethodName("sendInConversation")
    //this.addSubnode(action)
    //this.scheduleSyncToView()
  }
  */

  valueIsEditable () {
    return this.role() === "user"
  }

  key () {
    if (this.role() === "user") {
      return "user"
    }
    return "narrator"
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

  conversation () {
    return this.parentNode()
  }

  conversationHistoryPriorToSelfJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    const json = messages.slice(0, i).map(m => m.openAiJson())
    return json
  }

  conversationHistoryUpToAndIncludingSelfJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    const json = messages.slice(0, i+1).map(m => m.openAiJson())
    return json
  }

  send () {
    return this.sendInConversation()
  }

  async sendInConversation () {
    if (!this.request()) {
      const message = this.conversation().newMessage()
      message.setRole("assistant")
      //this.conversation().postShouldFocusSubnode(message)
      message.makeRequest()
    }
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

  /*
  assertValidRequest () {
    assert(this.validRoles().includes(this.role()))
  }
  */

  makeRequest () {
    const request = this.newRequest()
    this.setRequest(request)
    //request.asyncSend();
    request.setStreamTarget(this)
    request.asyncSendAndStreamResponse()
    return this
  }

  newRequest() {
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

  onRequestError (aRequest) {
    this.setError(aRequest.error())
    this.setContent("ERROR: " + aRequest.error().message)
    //this.setRequest(null)
  }

  onRequestComplete (aRequest) {
    //this.conversation().addAssistentMessageContent(aRequest.fullContent())
    //this.setRequest(null)
    //this.setStatus("complete")
  }
  
  onStreamData (request, newContent) {
    this.setContent(request.fullContent())
  }
  
  onStreamComplete (request) {
    this.conversation().newMessage().setRole("user")
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

}.initThisClass());
