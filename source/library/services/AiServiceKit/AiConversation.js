"use strict";

/**
 * @module library.services.AiServiceKit.AiConversation
 */

/**
 * @class AiConversation
 * @extends Conversation
 * @classdesc Represents an AI conversation with methods to manage messages, tokens, and chat interactions.
 */
(class AiConversation extends Conversation {

  /**
   * @description Initializes the prototype slots for the AiConversation class.
   */
  initPrototypeSlots () {

    /**
     * @property {AiChatModel} chatModel - Reference to AiChatModel
     */
    {
      const slot = this.newSlot("chatModel", null);
      slot.setSlotType("AiChatModel");
    }

    /**
     * @property {Number} initialMessagesCount - Number of initial messages to always keep
     */
    {
      const slot = this.newSlot("initialMessagesCount", 3);
      slot.setSlotType("Number");
    }

    /**
     * @property {AiResponseMessage} responseMsgClass - Class for response messages
     */
    {
      const slot = this.newSlot("responseMsgClass", null); 
      slot.setSlotType("AiResponseMessage");
    }

    /**
     * @property {Number} tokenCount - Sum of tokens of all messages
     */
    {
      const slot = this.newSlot("tokenCount", 0);
      slot.setSlotType("Number");
    }

    /**
     * @property {Number} tokenBuffer - Buffer to ensure approximation doesn't exceed limit
     */
    {
      const slot = this.newSlot("tokenBuffer", 400);
      slot.setSlotType("Number");
    }

    /**
     * @property {AiService} service - Pointer to AiService instance
     */
    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    /**
     * @property {Object} tagDelegate - Delegate to receive tag messages from responses
     */
    {
      const slot = this.newSlot("tagDelegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @property {String} aiSpeakerName - Name of the AI speaker
     */
    {
      const slot = this.newSlot("aiSpeakerName", null);
      slot.setSlotType("String");
    }

  }

  /**
   * @description Initializes the prototype of the AiConversation class.
   */
  initPrototype () {
    this.setSubnodeClasses([AiMessage]);
    this.setResponseMsgClass(AiResponseMessage);
  }

  /**
   * @description Gets the service associated with the chat model.
   * @returns {Object} The service object.
   */
  service () {
    return this.chatModel().service();
  }

  /**
   * @description Gets the chat model for the conversation.
   * @returns {AiChatModel} The chat model.
   */
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

  /**
   * @description Gets the parent conversations object.
   * @returns {AiConversations|null} The parent conversations object or null.
   */
  conversations () {
    const p = this.parentNode();
    if (p && p.thisClass().isKindOf(AiConversations)) {
      return p;
    }
    return null;
  }

  /**
   * @description Gets the maximum context token count.
   * @returns {Number} The maximum context token count.
   */
  maxContextTokenCount () {
    return this.chatModel().maxContextTokenCount();
  }

  /**
   * @description Updates the token count for the conversation.
   * @returns {AiConversation} The current instance.
   */
  updateTokenCount () {
    return this
  }

  /**
   * @description Checks and manages the token count.
   */
  checkTokenCount () {
    this.updateTokenCount()
    const tc = this.tokenCount()
    if (tc > this.maxContextTokenCount() * 0.9) {
      this.compactTokens()
    }
  }

  /**
   * @description Compacts tokens to manage conversation length.
   */
  compactTokens () {
  }

  /**
   * @description Creates a new assistant message.
   * @returns {AiMessage} The new assistant message.
   */
  newAssistantMessage () {
    const m = this.newMessage();
    m.setSpeakerName(this.aiSpeakerName());
    m.setRole("assistant");
    m.setConversation(this);
    return m;
  }

  /**
   * @description Creates a new system message.
   * @returns {AiMessage} The new system message.
   */
  newSystemMessage () {
    const m = this.newMessage();
    m.setSpeakerName("System Message");
    m.setRole("system");
    m.setIsComplete(true);
    m.setIsVisibleToUser(false);
    m.setConversation(this);
    return m;
  }

  /**
   * @description Creates a new user message.
   * @returns {AiMessage} The new user message.
   */
  newUserMessage () {
    const m = this.newMessage();
    m.setSpeakerName("User");
    m.setRole("user");
    m.setConversation(this);
    return m;
  }

  /**
   * @description Creates a new response message.
   * @returns {AiResponseMessage} The new response message.
   */
  newResponseMessage () {
    const m = this.newMessageOfClass(this.responseMsgClass());
    m.setConversation(this);
    this.addSubnode(m);
    return m;
  }

  /**
   * @description Gets the AI speaker name.
   * @returns {String} The AI speaker name.
   */
  aiSpeakerName () {
    if (this._aiSpeakerName) {
      return this._aiSpeakerName;
    }
    return this.chatModel().title().toUpperCase()
  }

  /**
   * @description Handles chat input value.
   * @param {String} v - The chat input value.
   * @returns {AiResponseMessage} The response message.
   */
  onChatInputValue (v) {
    const userMsg = this.newUserMessage();
    userMsg.setContent(v);
    userMsg.setIsComplete(true);
    const responseMessage = userMsg.requestResponse();
    SimpleSynth.clone().playSendBeep();
    return responseMessage; 
  }

  /**
   * @description Starts the conversation with a prompt.
   * @param {String} prompt - The initial prompt.
   * @returns {AiResponseMessage} The response message.
   */
  startWithPrompt (prompt) {
    this.clear();
    const promptMsg = this.newSystemMessage();
    promptMsg.setContent(prompt);
    const responseMessage = promptMsg.requestResponse();
    return responseMessage;
  }

  /**
   * @description Handles a new message from an update.
   * @param {AiMessage} newMsg - The new message.
   */
  onNewMessageFromUpdate (newMsg) {
  }

  /**
   * @description Gets the AI visible history for a response.
   * @param {AiResponseMessage} aResponseMessage - The response message.
   * @returns {Array} The visible messages for AI.
   */
  aiVisibleHistoryForResponse (aResponseMessage) {
    assert(this.messages().includes(aResponseMessage));
    const previousMessages = this.messages().before(aResponseMessage);
    const visibleMessages = previousMessages.select(m => m.isVisibleToAi());
    return visibleMessages;
  }

  /**
   * @description Gets the chat request class.
   * @returns {Class} The chat request class.
   */
  chatRequestClass () {
    return this.service().chatRequestClass();
  }

  /**
   * @description Handles message completion.
   * @param {AiMessage} aMsg - The completed message.
   * @returns {AiConversation} The current instance.
   */
  onMessageComplete (aMsg) {
    super.onMessageComplete(aMsg);
    return this;
  } 

  /**
   * @description Shuts down the conversation.
   * @returns {AiConversation} The current instance.
   */
  shutdown () {
    this.messages().forEach(m => m.performIfResponding("shutdown"));
    return this;
  }

  /**
   * @description Gets non-image messages.
   * @returns {Array} The non-image messages.
   */
  nonImageMessages () {
    return this.messages().select(m => !m.thisClass().isKindOf(HwImageMessage));
  }

  /**
   * @description Gets incomplete messages.
   * @returns {Array} The incomplete messages.
   */
  incompleteMessages () {
    return this.nonImageMessages().select(m => !m.isComplete());
  }

  /**
   * @description Checks if there are incomplete messages.
   * @returns {Boolean} True if there are incomplete messages, false otherwise.
   */
  hasIncompleteMessages () {
    return this.incompleteMessages().length > 0;
  }

  /**
   * @description Gets active responses.
   * @returns {Array} The active responses.
   */
  activeResponses () {
    return this.incompleteMessages().filter(m => m.isResponse());
  }

  /**
   * @description Checks if there are active responses.
   * @returns {Boolean} True if there are active responses, false otherwise.
   */
  hasActiveResponses () {
    return this.activeResponses().length > 0;
  }

  /**
   * @description Syncs the chat input state.
   * @returns {AiConversation} The current instance.
   */
  syncChatInputState () {
    return this;
  }

  /**
   * @description Checks if the conversation accepts chat input.
   * @returns {Boolean} True if it accepts chat input, false otherwise.
   */
  acceptsChatInput () {
    return !this.hasIncompleteMessages();
  }

  /**
   * @description Gets the session state tag names.
   * @returns {Array} The session state tag names.
   */
  sessionStateTagNames () {
    return ["session-json", "session-update"];
  }

  /**
   * @description Gets the session state tag map.
   * @returns {Map} The session state tag map.
   */
  sessionStateTagMap () {
    const m = new Map();
    m.set("session-json", "{content removed as it has been outdated. See session-json tag in the last message of the conversation for the latest session state}");
    m.set("session-update", "{content removed as the patch is already applied. See session-json tag in the last message of the conversation for the latest session state}");
    return m;
  }

  /**
   * @description Gets the session JSON.
   * @returns {Object|null} The session JSON or null.
   */
  sessionJson () {
    return null;
  }

  /**
   * @description Filters the JSON history of messages.
   * @param {Array} messages - The messages to filter.
   * @returns {Array} The filtered messages.
   */
  onFilterJsonHistory (messages) {
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