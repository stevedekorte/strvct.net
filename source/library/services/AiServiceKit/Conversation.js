/**
 * @module library.services.AiServiceKit
 */

"use strict";

/**
 * @class Conversation
 * @extends BMStorableNode
 * @classdesc Represents a conversation with messages and chat input functionality.
 */

(class Conversation extends BMStorableNode {
  /**
   * @description Initializes the prototype slots for the Conversation class.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      //const slot = this.newSlot("delegate", null);
      //slot.setSlotType("Object");
    }

  }

  /**
   * @description Initializes the prototype properties for the Conversation class.
   * @category Initialization
   */
  initPrototype () {
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("conversation");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);

    this.setSubnodeClasses([]);
    this.setNodeChildrenAlignment("flex-start"); // make the messages stick to the bottom
  }

  /**
   * @description Initializes a new Conversation instance.
   * @category Initialization
   */
  init() {
    super.init();

    {
      const f = ChatInputNode.clone();
      f.setCanDelete(false);
      f.setConversation(this);
      f.setHasValueButton(true);
      this.setFooterNode(f);
    }

  }

  /**
   * @description Handles chat edit value. To be overridden by subclasses.
   * @param {*} v - The value to be handled.
   * @category Event Handling
   */
  onChatEditValue (v) {
    // for subclasses to override
  }

  /*
  nodeFillsRemainingWidth () {
    return true;
  }
  */

  /**
   * @description Determines if subviews scroll sticks to bottom.
   * @returns {boolean} True if subviews scroll sticks to bottom.
   * @category UI
   */
  subviewsScrollSticksToBottom () {
    return true;
  }

  /**
   * @description Performs final initialization tasks for the Conversation instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    try {
     // assert(this.subnodeClasses().length > 0, this.type() + " has no subnode classes");
      this.messages().forEach(m => {
        //assert(this.subnodeClasses().includes(m.thisClass()), m.type() + " is not in " + JSON.stringify(this.subnodeClasses().map(c => c.type())));
        if(!m.setConversation) {
          debugger;
          throw new Error(m.type() + " missing setConversation() ");
        }
      });
    } catch (error) {
      //debugger;
      console.log(this.type() + " finalInit error: " + error.message);
      this.removeAllSubnodes();
    }
    //debugger;
    this.messages().forEach(m => m.setConversation(this));
    this.setNodeCanAddSubnode(false);
    //this.setNodeFillsRemainingWidth(true);
    this.setNodeChildrenAlignment("flex-end");
    this.setCanDelete(true);
  }

  /**
   * @description Gets all messages in the conversation.
   * @returns {Array} An array of message nodes.
   * @category Data Access
   */
  messages () {
    return this.subnodes()
  }

  /**
   * @description Clears all messages from the conversation.
   * @returns {Conversation} The conversation instance.
   * @category Data Manipulation
   */
  clear () {
    this.subnodes().forEach(msg => { 
      if (msg.shutdown) { 
        msg.shutdown() 
      }
    });
    this.removeAllSubnodes();
    return this
  } 

  /**
   * @description Handles message updates.
   * @param {*} aMsg - The updated message.
   * @category Event Handling
   */
  onMessageUpdate (aMsg) {
    // e.g. sent by OpenAiMessage for things like streaming updates
    // can be useful for sharing the changes with other clients
  }

  /**
   * @description Handles message completion.
   * @param {*} aMsg - The completed message.
   * @category Event Handling
   */
  onMessageComplete (aMsg) {
    this.footerNode().setValueIsEditable(true)
    if (aMsg.error() === null) {
      const pmsg = aMsg.previousMessage() 
      /*
      if (pmsg && pmsg.value() === this.summaryRequestPrompt()) {
        // it's a response to a summary request
        //this.removeSubnodes(aMsg.previousMessages())
      }
      */
      this.checkTokenCount()
    }
  }

  /**
   * @description Handles a completed message. To be overridden by subclasses.
   * @param {*} aMsg - The completed message.
   * @category Event Handling
   */
  onCompletedMessage (aMsg) {
  }

  /**
   * @description Creates a new message of a specified class.
   * @param {*} msgClass - The class of the message to create.
   * @returns {*} A new message instance.
   * @category Data Manipulation
   */
  newMessageOfClass (msgClass) {
    const m = msgClass.clone();
    m.setConversation(this);
    return m;
  }

  /**
   * @description Creates a new message and adds it to the conversation.
   * @returns {*} The new message instance.
   * @category Data Manipulation
   */
  newMessage () {
    const msgClass = this.subnodeClasses().first();
    const m = this.newMessageOfClass(msgClass);
    this.addSubnode(m);
    return m;
  }

  /**
   * @description Determines if the conversation accepts chat input.
   * @returns {boolean} True if chat input is accepted.
   * @category Input Handling
   */
  acceptsChatInput () {
    return true;
  }

  /**
   * @description Handles chat input value.
   * @param {*} v - The input value.
   * @category Input Handling
   */
  onChatInputValue (v) {
    debugger;
    if (!this.acceptsChatInput()) {
      console.warn(this.type() + " does not accept chat input");
      return;
    }
    const m = this.newMessage();
    m.setContent(v);
    m.setIsComplete(true);
    //this.footerNode().setValueIsEditable(false)
  }

  /**
   * @description Sets whether chat input is enabled.
   * @param {boolean} aBool - True to enable chat input, false to disable.
   * @returns {Conversation} The conversation instance.
   * @category Input Handling
   */
  setChatInputIsEnabled (aBool) {
    this.footerNode().setValueIsEditable(aBool);
    return this
  }

  /**
   * @description Clears the input field.
   * @category Input Handling
   */
  clearInput () {
    debugger; // shouldn't need this as TextField has option to do this
  }

  /**
   * @description Creates a JSON archive of the conversation.
   * @returns {Object} The JSON representation of the conversation.
   * @category Serialization
   */
  jsonArchive () {
    const msgsJson = [];
    this.messages().forEach(msg => {
      msgsJson.push(msg.jsonArchive());
    }) // we don't use map because it returns a SubnodesArray instance...
    assert(Type.isArray(msgsJson));

    const json = {
      type: this.type(),
      messages: msgsJson
    };
    return json;
  }

  /**
   * @description Sets the conversation state from a JSON archive.
   * @param {Object} json - The JSON representation of the conversation.
   * @returns {Conversation} The conversation instance.
   * @category Serialization
   */
  setJsonArchive (json) {
    assert(Type.isArray(json.messages)); // sanity check

    this.removeAllSubnodes();

    json.messages.forEach(msgJson => {
      this.newMessageFromJson(msgJson);
    });
    return this;
  }
  
  /**
   * @description Finds a message with a specific ID.
   * @param {string} messageId - The ID of the message to find.
   * @returns {*} The message with the specified ID, or undefined if not found.
   * @category Data Access
   */
  messageWithId (messageId) {
    return this.messages().detect(msg => msg.messageId() === messageId)
  }

  /**
   * @description Creates a new message from JSON and adds it to the conversation.
   * @param {Object} msgJson - The JSON representation of the message.
   * @returns {*} The new message instance.
   * @category Data Manipulation
   */
  newMessageFromJson (msgJson) {
    const msg = ConversationMessage.fromJsonArchive(msgJson)
    msg.setConversation(this)
    this.addSubnode(msg)
    return msg
  }

  /**
   * @description Updates an existing message or creates a new one from JSON.
   * @param {Object} msgJson - The JSON representation of the message.
   * @returns {*} The updated or new message instance.
   * @category Data Manipulation
   */
  updateMessageJson (msgJson) {
    const oldMsg = this.messageWithId(msgJson.messageId);

    if (oldMsg) {
      oldMsg.setJsonArchive(msgJson)
      return oldMsg
    } else {
      const newMsg = this.newMessageFromJson(msgJson);
      if (newMsg.onNewFromNetwork) {
        newMsg.scheduleMethod("onNewFromNetwork");
      }
      SimpleSynth.clone().playReceiveBeep();
      this.onNewMessageFromUpdate(newMsg);
      //console.warn(this.typeId() + " updateMessageJson no message found with messageId '" + messageId + "'");
      return newMsg;
    }
  }

  /**
   * @description Handles a new message from an update. To be overridden by subclasses.
   * @param {*} newMsg - The new message.
   * @category Event Handling
   */
  onNewMessageFromUpdate (newMsg) {
    // for subclasses to override
  }

  // --- enable / disable input ---

  /*
  disableInput () {
    this.footerNode().disableEnter();
    return this
  }

  enableInput () {
    this.footerNode().enableEnter();
    return this
  }
  */

}.initThisClass());