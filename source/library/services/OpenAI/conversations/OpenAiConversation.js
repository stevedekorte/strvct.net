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

  }

  init() {
    super.init();
    this.setSubnodeClasses([OpenAiMessage])
  }

  finalInit () {
    super.finalInit()
  }

  // -------- 

  service () {
    return this.conversations().service()
  }

  selectedModel () {
    return "gpt-4";
  }

  conversations () {
    return this.parentNode()
  }

  // --- history ---
  // --- summary ---

  updateTokenCount () {
    const count = this.subnodes().sum(message => message.tokenCount())
    this.setTokenCount(count)
    return this
  }

  trimConversation() {
    // todo - implement
    return this;
  }

  // --- overrides ---

  initNewMessage (aMessage) {
    aMessage.setRole("user")
    return aMessage
  }

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

  // --- chat actions ---

  aiSpeakerName () {
    return this.selectedModel().toUpperCase()
  }

  onChatInputValue (v) {
    const m = this.newMessage()
    m.setRole("user")
    m.setContent(v)

    const responseMessage = m.sendInConversation();
    responseMessage.setSpeakerName(this.aiSpeakerName())

    this.footerNode().setValueIsEditable(false) // wait for response to enable again
    SimpleSynth.clone().playSendBeep()
  }

  startWithPrompt (prompt) {
    this.clear()
    
    const m = this.newMessage()
    m.setSpeakerName(this.aiSpeakerName())
    m.setRole("system")
    m.setContent(prompt)
    const responseMessage = m.send()
    responseMessage.setSpeakerName(this.aiSpeakerName())
    return this
  }

  onNewMessageFromUpdate (newMsg) {
    // TODO: we only want to do this when message isComplete
    /*
    if (!this.session().isHost() && newMsg.isComplete()) {
      const responseMessage = newMsg.sendInConversation();
      responseMessage.setSpeakerName(this.aiSpeakerName())
    }
    */
  }

}.initThisClass());
