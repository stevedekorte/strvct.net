"use strict";

/* 
    OpenAiConversation

*/

(class OpenAiConversation extends Conversation {
  
  initPrototypeSlots() {

    {
      const slot = this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    }

    {
      const slot = this.newSlot("tokenCount", 0); // sum of tokens of all messages
    }

    {
      const slot = this.newSlot("maxTokenCount", 8000); // max allowed by model
    }

    {
      const slot = this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
    }

    {
      const slot = this.newSlot("model", null); 
    }

    {
      const slot = this.newSlot("responseMsgClass", null); 
    }

  }

  init() {
    super.init();
    this.setSubnodeClasses([OpenAiMessage]);
    this.setResponseMsgClass(OpenAiResponseMessage);
  }

  finalInit () {
    super.finalInit()
  }

  // -------- 

  service () {
    return this.conversations().service()
  }

  selectedModel () {
    return "gpt-4-1106-preview";
  }

  conversations () {
    return this.parentNode()
  }

  // --- history ---
  // --- summary ---

  updateTokenCount () {
    /*
    const count = this.subnodes().sum(message => message.tokenCount())
    this.setTokenCount(count)
    */
    return this
  }

  /*
  trimConversation() {
    // todo - implement
    return this;
  }
  */

  // -- managing tokens ---

  checkTokenCount () {
    this.updateTokenCount()
    const tc = this.tokenCount()
    console.log("token count: ", tc)
    if (tc > this.maxTokenCount() * 0.9) {
      this.compactTokens()
    }
  }

  compactTokens () {
    // skip for now
    /*
    const m = this.messages().last()
    m.sendSummaryMessage()
    */
  }

  // --- new messages ---
  // this is a bit verbose, but (for now) I like the explicitness 
  // and that it might make it easier to support other AI services

  newUserMessage () {
    const m = this.newMessage();
    m.setSpeakerName("User"); // caller should override this
    m.setRole("user");
    return m;
  }

  newAssistantMessage () {
    const m = this.newMessage();
    m.setSpeakerName(this.aiSpeakerName());
    m.setRole("assistant");
    return m;
  }

  newSystemMessage () {
    const m = this.newMessage();
    m.setSpeakerName(this.aiSpeakerName());
    m.setRole("system");
    return m;
  }

  newResponseMessage () {
    const m = this.newMessageOfClass(this.responseMsgClass());
    this.addSubnode(m);
    return m;
  }

  // --- chat actions ---

  aiSpeakerName () {
    return this.selectedModel().toUpperCase()
  }

  onChatInputValue (v) {
    const userMsg = this.newUserMessage();
    userMsg.setContent(v);
    userMsg.setIsComplete(true);
    const responseMessage = userMsg.requestResponse();
    this.footerNode().setValueIsEditable(false); // wait for response to enable again
    SimpleSynth.clone().playSendBeep();
  }

  startWithPrompt (prompt) {
    this.clear()
    const promptMsg = this.newSystemMessage();
    promptMsg.setContent(prompt);
    const responseMessage = promptMsg.requestResponse();
    return this
  }

  onNewMessageFromUpdate (newMsg) {
    // TODO: we only want to do this when message isComplete
    /*
    if (!this.session().isHost() && newMsg.isComplete()) {
      const responseMessage = newMsg.requestResponse();
    }
    */
  }

}.initThisClass());
