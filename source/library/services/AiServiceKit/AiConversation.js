"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiConversation
 * @extends Conversation
 * @classdesc Represents an AI conversation with methods to manage messages, tokens, and chat interactions.
 */
(class AiConversation extends Conversation {

  /**
   * @description Initializes the prototype slots for the AiConversation class.
   * @category Initialization
   */
  initPrototypeSlots () {

    /**
     * @member {AiChatModel} chatModel - Reference to AiChatModel
     * @category Configuration
     */
    {
      const slot = this.newSlot("chatModel", null);
      slot.setSlotType("AiChatModel");
    }

    /**
     * @member {Number} initialMessagesCount - Number of initial messages to always keep
     * @category Configuration
     */
    {
      const slot = this.newSlot("initialMessagesCount", 3);
      slot.setSlotType("Number");
    }

    /**
     * @member {AiResponseMessage} responseMsgClass - Class for response messages
     * @category Configuration
     */
    {
      const slot = this.newSlot("responseMsgClass", null); 
      slot.setSlotType("AiResponseMessage class");
    }

    /**
     * @member {Number} tokenCount - Sum of tokens of all messages
     * @category State
     */
    {
      const slot = this.newSlot("tokenCount", 0);
      slot.setSlotType("Number");
    }

    /**
     * @member {Number} tokenBuffer - Buffer to ensure approximation doesn't exceed limit
     * @category Configuration
     */
    {
      const slot = this.newSlot("tokenBuffer", 400);
      slot.setSlotType("Number");
    }

    /**
     * @member {AiService} service - Pointer to AiService instance
     * @category Configuration
     */
    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    /**
     * @member {String} aiSpeakerName - Name of the AI speaker
     * @category Configuration
     */
      {
        const slot = this.newSlot("aiSpeakerName", null);
        slot.setSlotType("String");
      }

        
    /**
     * @member {Object} tagDelegate - Delegate to receive tag messages from responses. 
     * @category Delegates
     */
    {
      const slot = this.newSlot("tagDelegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {Object} clientStateDelegate - Delegate to receive getJson, asRootJsonSchemaString messages 
     * @category Delegates
     */
    {
      const slot = this.newSlot("clientStateDelegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {Object} promptDelegate - Delegate from which we get the system prompt for the conversation.
     * @category Delegates
     */
    {
      const slot = this.newSlot("promptDelegate", null); // on start, we send a systemPromptString message to the delegate.
      slot.setSlotType("Object");
    }

    {
      const slot = this.newSlot("jsonHistoryString", null);
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setCanInspect(false);
    }

    {
      const slot = this.newSlot("assistantApiCalls", null);
      slot.setSlotType("AssistantApiCalls");
      slot.setFinalInitProto(AssistantApiCalls);
      slot.setCanInspect(true);
    }
  }

  jsonHistoryString () {
    const lastMessage = this.messages().last();
    if (lastMessage) {
      const jsonHistory = lastMessage.jsonHistory();
      const s = JSON.stableStringifyWithStdOptions(jsonHistory, null, 2);
      return s;
    }
    return "[no messages]";
  }


  /**
   * @description Initializes the prototype of the AiConversation class.
   * @category Initialization
   */
  initPrototype () {
    this.setSubnodeClasses([AiMessage]);
    this.setResponseMsgClass(AiResponseMessage);
    //this.setApiCallClasses([RollDiceApiCall,PlayMusicApiCall, PlaySoundFxApiCall]);
  }

  /**
   * @description Gets the service associated with the chat model.
   * @returns {Object} The service object.
   * @category Service
   */
  service () {
    return this.chatModel().service();
  }

  /**
   * @description Gets the chat model for the conversation.
   * @returns {AiChatModel} The chat model.
   * @category Configuration
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
   * @category Navigation
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
   * @category Configuration
   */
  maxContextTokenCount () {
    return this.chatModel().maxContextTokenCount();
  }

  /**
   * @description Updates the token count for the conversation.
   * @returns {AiConversation} The current instance.
   * @category State
   */
  updateTokenCount () {
    return this
  }

  /**
   * @description Checks and manages the token count.
   * @category State
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
   * @category State
   */
  compactTokens () {
  }

  /**
   * @description Creates a new assistant message.
   * @returns {AiMessage} The new assistant message.
   * @category Message Creation
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
   * @category Message Creation
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
   * @category Message Creation
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
   * @category Message Creation
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
   * @category Configuration
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
   * @category Interaction
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
   * @description Composes the API specification prompt.
   * @returns {String} The API specification prompt.
   * @category Configuration
   */
  composeApiSpecPrompt () {
    let s = "The following APIs are available for you to use:\n\n";
    const apiCallClasses = this.apiCallClasses();
    const apiSpecPrompt = apiCallClasses.map(c => c.apiSpecPrompt()).join("\n\n");
    s += apiSpecPrompt;
    return s;
  }

  /**
   * @description Starts the conversation after fetching the system prompt from the promptDelegate.
   * @returns {AiResponseMessage} The response message.
   * @category Interaction
   */
  start () {
    const promptDelegate = this.promptDelegate();
    if (promptDelegate) {
      const systemPrompt = promptDelegate.assistantSystemPromptString();
      const apiPrompt = this.composeApiSpecPrompt();
      const prompt = systemPrompt + "\n\n" + apiPrompt;
      debugger;
      return this.startWithPrompt(prompt);
    } else {
      throw new Error("no promptDelegate to get system prompt from");
    }
  }

  /**
   * @description Starts the conversation with a prompt.
   * @param {String} prompt - The initial prompt.
   * @returns {AiResponseMessage} The response message.
   * @category Interaction
   */
  startWithPrompt (prompt) {
    debugger;
    this.clear();
    const promptMsg = this.newSystemMessage();
    promptMsg.setContent(prompt);
    const responseMessage = promptMsg.requestResponse();
    return responseMessage;
  }

  /**
   * @description Handles a new message from an update.
   * @param {AiMessage} newMsg - The new message.
   * @category Message Handling
   */
  onNewMessageFromUpdate (newMsg) {
  }

  /**
   * @description Gets the AI visible history for a response.
   * @param {AiResponseMessage} aResponseMessage - The response message.
   * @returns {Array} The visible messages for AI.
   * @category Message Handling
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
   * @category Configuration
   */
  chatRequestClass () {
    return this.service().chatRequestClass();
  }

  /**
   * @description Handles message completion.
   * @param {AiMessage} aMsg - The completed message.
   * @returns {AiConversation} The current instance.
   * @category Message Handling
   */
  onMessageComplete (aMsg) {
    super.onMessageComplete(aMsg);
    return this;
  } 

  /**
   * @description Shuts down the conversation.
   * @returns {AiConversation} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.messages().forEach(m => m.performIfResponding("shutdown"));
    return this;
  }

  /**
   * @description Gets non-image messages.
   * @returns {Array} The non-image messages.
   * @category Message Filtering
   */
  nonImageMessages () {
    return this.messages().select(m => !m.thisClass().isKindOf(HwImageMessage));
  }

  /**
   * @description Gets incomplete messages.
   * @returns {Array} The incomplete messages.
   * @category Message Filtering
   */
  incompleteMessages () {
    return this.nonImageMessages().select(m => !m.isComplete());
  }

  /**
   * @description Checks if there are incomplete messages.
   * @returns {Boolean} True if there are incomplete messages, false otherwise.
   * @category State
   */
  hasIncompleteMessages () {
    return this.incompleteMessages().length > 0;
  }

  /**
   * @description Gets active responses.
   * @returns {Array} The active responses.
   * @category Message Filtering
   */
  activeResponses () {
    return this.incompleteMessages().filter(m => m.isResponse());
  }

  /**
   * @description Checks if there are active responses.
   * @returns {Boolean} True if there are active responses, false otherwise.
   * @category State
   */
  hasActiveResponses () {
    return this.activeResponses().length > 0;
  }

  /**
   * @description Syncs the chat input state.
   * @returns {AiConversation} The current instance.
   * @category State
   */
  syncChatInputState () {
    return this;
  }

  /**
   * @description Checks if the conversation accepts chat input.
   * @returns {Boolean} True if it accepts chat input, false otherwise.
   * @category State
   */
  acceptsChatInput () {
    return !this.hasIncompleteMessages();
  }

  /* --- Client State --- */


  /**
   * @description Gets the session state tag map.
   * @returns {Map} The session state tag map.
   * @category Session State
   */
  clientStateTagMap () {
    const m = new Map();
    m.set("client-state",       "{Content removed as it has been outdated. See client-state tag in the last message of the conversation for the latest client state.}");
    m.set("client-state-patch", "{Content removed as the patch is already applied. See client-state tag in the last message of the conversation for the latest client state.}");
    return m;
  }

  /**
   * @description Gets the session JSON. This gets inserted into the last message of the conversation. Note: session JSON gets removed from all but the last message.
   * @returns {Object|null} The session JSON or null.
   * @category Session State
   */
  clientStateJson () {
    const delegate = this.clientStateDelegate();
    if (delegate) {
      return delegate.asJsonString();
    }
    return null;
  }

  /**
   * @description Gets the client state schema.
   * @returns {String} The client state schema.
   * @category Client State
   */
  clientStateJsonSchema () {
    const delegate = this.clientStateDelegate();
    if (delegate) {
      return delegate.asRootJsonSchemaString();
    }
    return null;
  }

  /**
   * @description Filters the JSON history of messages.
   * @param {Array} messages - The messages to filter.
   * @returns {Array} The filtered messages.
   * @category Session State
   */
  onFilterJsonHistory (messages) {
    const json = this.clientStateJson();

    if (json) {
      const tagMap = this.clientStateTagMap();

      const lastMessage = messages.last();
      const jsonHistory = messages.map(m => {
        if (m !== lastMessage) {
          m.content = m.content.replaceContentOfHtmlTagMap(tagMap);
          // or should we just remove the tags entirely, or replace them with a note that they were removed?
        } else {
          const schema = this.clientStateJsonSchema();
          const schemaString = JSON.stableStringifyWithStdOptions(schema, null, 2);
          const jsonString = JSON.stableStringifyWithStdOptions(json, null, 2);
          m.content = m.content + "\n\n" +"<client-state><schema>" + schemaString + "</schema><payload>" + jsonString + "</payload></client-state>";
        }
        return m;
      });
      return jsonHistory;
    }

    return messages;
  }

}.initThisClass());