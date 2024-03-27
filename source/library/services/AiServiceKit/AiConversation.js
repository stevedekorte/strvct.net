"use strict";

/* 
    AiConversation

*/

(class AiConversation extends Conversation {
  
  initPrototypeSlots() {

    {
      const slot = this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
    }

    {
      const slot = this.newSlot("responseMsgClass", null); 
    }

    // token counting

    {
      const slot = this.newSlot("tokenCount", 0); // sum of tokens of all messages
    }

    {
      const slot = this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    }


  }

  init() {
    super.init();
    this.setSubnodeClasses([AiMessage]);
    this.setResponseMsgClass(AiResponseMessage);
  }

  finalInit () {
    super.finalInit()
  }

  // -------- 

  service () {
    return this.conversations().service()
  }

  selectedModel () {
    return this.service().chatModelName();
  }

  conversations () {
    return this.parentNode()
  }

  // --- history ---
  // --- summary ---

  maxContextTokenCount () {
    return this.service().chatModel().maxContextTokenCount();
  }

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
    if (tc > this.maxContextTokenCount() * 0.9) {
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

  newAssistantMessage () {
    const m = this.newMessage();
    m.setSpeakerName(this.aiSpeakerName());
    m.setRole("assistant");
    m.setConversation(this);
    return m;
  }

  newSystemMessage () {
    const m = this.newMessage();
    m.setSpeakerName(this.aiSpeakerName());
    m.setRole("system");
    m.setIsComplete(true);
    m.setIsVisibleToUser(false);
    m.setConversation(this);
    return m;
  }


  newUserMessage () {
    const m = this.newMessage();
    m.setSpeakerName("User"); // caller should override this
    m.setRole("user");
    m.setConversation(this);
    return m;
  }

  newResponseMessage () {
    const m = this.newMessageOfClass(this.responseMsgClass());
    m.setConversation(this);
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
    this.clear();
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

  aiVisibleHistoryForResponse (aResponseMessage) {
    assert(this.messages().includes(aResponseMessage));
    const previousMessages = this.messages().before(aResponseMessage);
    const visibleMessages = previousMessages.select(m => m.isVisibleToAi());
    /*
      override to support summaries
    */
    return visibleMessages;
  }

  chatRequestClass () {
    return this.service().chatRequestClass();
  }

  onMessageComplete (aMsg) {
    super.onMessageComplete(aMsg);
    return this;
  } 

}.initThisClass());
