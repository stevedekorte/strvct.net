"use strict";

/* 
    AiConversation

*/

(class AiConversation extends Conversation {

  /*
  static oneShotRequest (prompt) {
    const conversation = this.clone();
    const responseMessage = conversation.startWithPrompt(prompt);
    return responseMessage;
  }
  */
  
  initPrototypeSlots () {

    {
      const slot = this.newSlot("chatModel", null); // ref to AiChatModel
      slot.setSlotType("AiChatModel");
    }


    {
      const slot = this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
      slot.setSlotType("Number");
    }

    {
      const slot = this.newSlot("responseMsgClass", null); 
      slot.setSlotType("AiResponseMessage");
    }

    // token counting

    {
      const slot = this.newSlot("tokenCount", 0); // sum of tokens of all messages
      slot.setSlotType("Number");
    }

    {
      const slot = this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
      slot.setSlotType("Number");
    }

    {
      const slot = this.newSlot("service", null); // pointer to AiService instance
      slot.setSlotType("AiService");
    }

    {
      const slot = this.newSlot("tagDelegate", null); // delegate to receive tag messages from responses
      slot.setSlotType("Object");
    }

    {
      const slot = this.newSlot("aiSpeakerName", null); // name of the AI speaker
      slot.setSlotType("String");
    }

  }

  initPrototype () {
    this.setSubnodeClasses([AiMessage]);
    this.setResponseMsgClass(AiResponseMessage);
  }

  // -------- 

  service () {
    return this.chatModel().service();
  }

  chatModel () {
    if (this._chatModel) {
      return this._chatModel;
    }

    if (this.conversations()) {
      return this.conversations().service().defaultChatModel();
    } else {
      const model = App.shared().services().defaultChatModel();
      assert(model, "no default chat model");
      return model;
    }

    throw new Error("no chatModel");
    return null;
  }

  conversations () {
    const p = this.parentNode();
    if (p && p.thisClass().isKindOf(AiConversations)) {
      return p;
    }
    return null;
  }

  // --- summary ---

  maxContextTokenCount () {
    return this.chatModel().maxContextTokenCount();
  }

  updateTokenCount () {
    /*
    const count = this.subnodes().sum(message => message.tokenCount())
    this.setTokenCount(count)
    */
    return this
  }

  // -- managing tokens ---

  checkTokenCount () {
    this.updateTokenCount()
    const tc = this.tokenCount()
    //console.log("token count: ", tc)
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
    m.setSpeakerName("System Message");
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
    if (this._aiSpeakerName) {
      return this._aiSpeakerName;
    }
    return this.chatModel().title().toUpperCase()
  }

  onChatInputValue (v) {
    const userMsg = this.newUserMessage();
    userMsg.setContent(v);
    userMsg.setIsComplete(true);
    const responseMessage = userMsg.requestResponse();
    //this.footerNode().setValueIsEditable(false); // wait for response to enable again
    SimpleSynth.clone().playSendBeep();
    return responseMessage; 
  }

  startWithPrompt (prompt) {
    this.clear();
    const promptMsg = this.newSystemMessage();
    promptMsg.setContent(prompt);
    const responseMessage = promptMsg.requestResponse();
    return responseMessage;
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

  shutdown () {
    this.messages().forEach(m => m.performIfResponding("shutdown"));
    return this;
  }

  // search helpers

  nonImageMessages () {
    return this.messages().select(m => !m.thisClass().isKindOf(HwImageMessage));
  }

  incompleteMessages () {
    return this.nonImageMessages().select(m => !m.isComplete());
  }

  hasIncompleteMessages () {
    return this.incompleteMessages().length > 0;
  }

  activeResponses () {
    return this.incompleteMessages().filter(m => m.isResponse());
  }

  hasActiveResponses () {
    return this.activeResponses().length > 0;
  }

  syncChatInputState () {
    //this.footerNode().setValueIsEditable(this.activeResponses().length === 0);
    return this;
  }

  acceptsChatInput () {
    // override Conversation implementation
    return !this.hasIncompleteMessages();
  }

  /*
  prepareForFirstAccess () {
    super.prepareForFirstAccess();
    const delegate = this.tagDelegate();
    if (delegate && delegate.onConversationPrepareForFirstAccess) {
      delegate.onConversationPrepareForFirstAccess(this);
    }
  }
  */

  sessionStateTagNames () {
    return ["session-json", "session-update"];
  }

  sessionStateTagMap () {
    const m = new Map();
    m.set("session-json", "{content removed as it has been outdated. See session-json tag in the last message of the conversation for the latest session state}");
    m.set("session-update", "{content removed as the patch is already applied. See session-json tag in the last message of the conversation for the latest session state}");
    return m;
  }

  sessionJson () {
    return null;
  }

  onFilterJsonHistory (messages) {
    // subclasses can override this to modify the history sent with the request
    const json = this.sessionJson();
    if (json) {

      const lastMessage = messages.last();
      const jsonHistory = messages.map(m => {
        if (m !== lastMessage) {
          m.content = m.content.replaceContentOfHtmlTagMap(this.sessionStateTagMap());
        } else {
            const sessionJsonString = JSON.stableStringify(json, 2, 2);
            m.content = m.content + "\n\n" +"<session-json>" + sessionJsonString + "</session-json>";
          }
        return m;
      });
      return jsonHistory;
    }

    return messages;
  }

}.initThisClass());
