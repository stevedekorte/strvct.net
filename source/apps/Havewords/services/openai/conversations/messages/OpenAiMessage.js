"use strict";

/* 
    OpenAiMessage

*/

(class OpenAiMessage extends BMStorableNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("role", "system"); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validRoles())
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("content", "");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("request", null);
    }

    {
      const slot = this.newSlot("isResponse", null);
    }


    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setTitle("Message")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit()
    const action = BMActionNode.clone().setTitle("Send").setTarget(this).setMethodName("sendInConversation")
    this.addSubnode(action)
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

  conversationHistoryJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    const json = messages.slice(0, i+1).map(m => m.openAiJson())
    return json
  }

  async sendInConversation () {
    if (!this.request()) {
      const request = this.newRequest()
      this.setRequest(request)
      request.asyncSend();
    }
  }

  // --- send request -------------

  selectedModel () {
    return this.conversation().selectedModel()
  }

  apiKey () {
    return this.conversation().conversations().service().apiKey()
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    request.setDelegate(this)
    request.setBodyJson({
      model: this.selectedModel(),
      messages: this.conversationHistoryJson(),
      temperature: 0.7, // more creative
      top_p: 0.9 // more diverse
    });
    return request;
  }

  onRequestError (aRequest) {
    this.setError(aRequest.error())
    this.setRequest(null)
  }

  onRequestComplete (aRequest) {
    this.conversation().addAssistentMessageContent(aRequest.fullContent())
    //this.setRequest(null)
  }

}.initThisClass());
