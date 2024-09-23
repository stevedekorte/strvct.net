"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class ConversationMessage
 * @extends BMTextAreaField
 * @classdesc Represents a message in a conversation.
 */
(class ConversationMessage extends BMTextAreaField {

  /**
   * Initialize prototype slots for the ConversationMessage class.
   * @method
   */
  initPrototypeSlots () {

    /**
     * @property {String} key - The key of the message.
     */
    {
      const slot = this.overrideSlot("key");
      slot.setShouldJsonArchive(true);
      slot.setCanInspect(true);
      slot.setSlotType("String");
    }

    /**
     * @property {String} value - The value or content of the message.
     */
    {
      const slot = this.overrideSlot("value");
      slot.setInitValue("");
      slot.setShouldJsonArchive(true);
      slot.setCanInspect(true);
      slot.setInspectorPath("Node/Field/Value");
      slot.setSlotType("String");
    }

    /**
     * @property {Conversation} conversation - The conversation this message belongs to.
     */
    {
      const slot = this.newSlot("conversation", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false);
      slot.setSlotType("Conversation");
    }

    /**
     * @property {String} messageId - The unique identifier of the message.
     */
    {
      const slot = this.newSlot("messageId", null);
      slot.setShouldJsonArchive(true)
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("String");
    }

    /**
     * @property {String} senderId - The identifier of the sender.
     */
    {
      const slot = this.newSlot("senderId", null);
      slot.setSlotType("String");
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setShouldJsonArchive(true);
      slot.setSlotType("String");
    }

    /**
     * @property {String} inReplyToMessageId - The identifier of the message this is replying to.
     */
    {
      const slot = this.newSlot("inReplyToMessageId", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true)
      slot.setSlotType("String");
      slot.setShouldJsonArchive(true)
    }

    /**
     * @property {Number} timestamp - The timestamp of the message.
     */
    {
      const slot = this.newSlot("timestamp", null);
      slot.setCanInspect(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true)
      slot.setSlotType("Number");
      //slot.setShouldJsonArchive(true)
    }

    /*
    {
      const slot = this.newSlot("annotations", null); // a place for any sort of extra JSON info
      slot.setShouldStoreSlot(true)
      slot.setShouldJsonArchive(false)
    }
    */

    /**
     * @property {Boolean} isComplete - Indicates if the message is complete.
     */
    {
      const slot = this.newSlot("isComplete", false);
      slot.setShouldJsonArchive(true)
      slot.setCanInspect(true);
      //slot.setDoesHookSetter(true); // no longer needed?
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true)
    }

    /**
     * @property {Error} error - Any error associated with the message.
     */
    {
      const slot = this.newSlot("error", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false);
      slot.setSlotType("Error");
    }

    /**
     * @property {Boolean} isVisibleToUser - Indicates if the message is visible to the user.
     */
    {
      const slot = this.newSlot("isVisibleToUser", true);
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true)
    }

    /**
     * @property {Object} delegate - The delegate object for the message.
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false)
    }

    /**
     * @property {Action} deleteAction - The action to delete the message.
     */
    {
      const slot = this.newSlot("deleteAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Delete");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setCanInspect(true)
      slot.setActionMethodName("delete");
    }

    /**
     * @property {Action} deleteFollowingMessagesAction - The action to delete following messages.
     */
    {
      const slot = this.newSlot("deleteFollowingMessagesAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Delete Following Messages");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setCanInspect(true)
      slot.setActionMethodName("deleteFollowingMessages");
    }
  }

  /**
   * Initialize the prototype of the ConversationMessage class.
   * @method
   */
  initPrototype () {
    this.setNodeTileClassName("BMChatInputTile");
    //this.setOverrideSubviewProto(this.nodeTileClass());
    this.setKeyIsVisible(true);
    this.setValueIsEditable(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanDelete(true);
  }

  /**
   * Perform final initialization of the ConversationMessage instance.
   * @method
   */
  finalInit () {
    super.finalInit();
    this.createIdIfAbsent();
    //this. (BMTextAreaFieldTile);
  }

  /**
   * Create a message ID if it doesn't exist.
   * @method
   */
  createIdIfAbsent () {
    if (!this.messageId()) {
      this.setMessageId(Object.newUuid());
    }
  }

  /**
   * Get the message this message is replying to.
   * @method
   * @returns {ConversationMessage|null} The message being replied to, or null if none.
   */
  inReplyToMessage () {
    const id = this.inReplyToMessageId();
    if (id) {
      return this.conversation().messageWithId(id);
    }
    return null
  }

  /**
   * Get the replies to this message.
   * @method
   * @returns {Array} An array of messages that are replies to this message.
   */
  replies () {
    const mid = this.messageId()
    return this.conversation().messages().select(m => m.inReplyToMessageId() === mid)
  }

  /**
   * Handle updates to the isComplete slot.
   * @method
   * @param {*} oldValue - The old value of isComplete.
   * @param {*} newValue - The new value of isComplete.
   */
  didUpdateSlotIsComplete (oldValue, newValue) {
    //debugger;
    if(newValue && this.conversation()) { // so not called during deserialization
      this.scheduleMethod("onComplete");
    }
  }

  /**
   * Handle completion of the message.
   * @method
   */
  onComplete () {
    // to be overridden by subclasses
    this.sendDelegate("onCompletedMessage");
  }

  /**
   * Check if the value is editable.
   * @method
   * @returns {Boolean} True if the value is editable, false otherwise.
   */
  valueIsEditable () {
    debugger;
    return this._valueIsEditable && !this.isComplete();
  }

  /**
   * Set whether to send in conversation.
   * @method
   * @param {*} v - The value to set.
   */
  setSendInConversation (v) {
    debugger;
  }

  /**
   * Check if the value is editable.
   * @method
   * @returns {Boolean} Always returns true.
   */
  valueIsEditable () {
    return true
  }

  /**
   * Get the content of the message.
   * @method
   * @returns {String} The content of the message.
   */
  content () {
    return this.value()
  }

  /**
   * Set the value of the message.
   * @method
   * @param {String} s - The value to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   */
  setValue (s) {
    super.setValue(s)
    this.directDidUpdateNode() // so updates trigger UI refresh
    return this
  }

  /**
   * Set the content of the message.
   * @method
   * @param {String} s - The content to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   */
  setContent (s) {
    this.setValue(s)
    //this.directDidUpdateNode()
    return this
  }

  /**
   * Get the subtitle of the message.
   * @method
   * @returns {String} The subtitle of the message.
   */
  subtitle () {
    let s = this.content()
    const max = 40
    if (s.length > max) {
      s = this.content().slice(0, max) + "..."
    }
    return this.speakerName() + "\n" + s
  }

  /**
   * Get the speaker name.
   * @method
   * @returns {String} The speaker name.
   */
  speakerName () {
    return this.key()
  }

  /**
   * Set the speaker name.
   * @method
   * @param {String} s - The speaker name to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   */
  setSpeakerName (s) {
    return this.setKey(s)
  }

  /**
   * Get visible previous messages.
   * @method
   * @returns {Array} An array of visible previous messages.
   */
  visiblePreviousMessages () {
    // subclasses should override for different behaviors
    return this.previousMessages()
  }

  /**
   * Get previous messages.
   * @method
   * @returns {Array} An array of previous messages.
   */
  previousMessages () {
    const msgs = this.conversation().messages();
    assert(msgs.includes(this));
    return msgs.before(this);
  }

  /**
   * Get previous messages including this message.
   * @method
   * @returns {Array} An array of previous messages including this message.
   */
  previousMessagesIncludingSelf () {
    const messages = this.previousMessages();
    messages.push(this);
    return messages;
  }

  /**
   * Get the previous message.
   * @method
   * @returns {ConversationMessage|null} The previous message or null if none.
   */
  previousMessage () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    if (i > -1) {
      return messages[i-1]
    }
    return null
  }

  /**
   * Get following messages.
   * @method
   * @returns {Array} An array of following messages.
   */
  followingMessages () {
    return this.conversation().messages().after(this);
  }

  /**
   * Get following messages including this message.
   * @method
   * @returns {Array} An array of following messages including this message.
   */
  followingMessagesIncludingSelf () {
    const messages = this.followingMessages();
    messages.unshift(this);
    return messages;
  }

  /**
   * Delete following messages.
   * @method
   * @returns {ConversationMessage} The ConversationMessage instance.
   */
  deleteFollowingMessages () {
    const messages = this.followingMessages();
    messages.forEach(m => m.delete());
    return this;
  }

  /**
   * Send the message.
   * @method
   */
  send () {
  }

  /**
   * Get the value error.
   * @method
   * @returns {String|null} The error message or null if no error.
   */
  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  /**
   * Handle value input.
   * @method
   */
  onValueInput () {
    this.requestResponse()
  }

  /**
   * Get the delegate.
   * @method
   * @returns {Object} The delegate object.
   */
  delegate () {
    if (!this._delegate) {
      return this.conversation()
    }
    return this._delegate
  }

  /**
   * Send a method call to the delegate.
   * @method
   * @param {String} methodName - The name of the method to call.
   * @param {Array} args - The arguments to pass to the method.
   * @returns {Boolean} True if the method was called successfully, false otherwise.
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

  /**
   * Clean up if the message is incomplete.
   * @method
   */
  cleanupIfIncomplete () {
    // called on startup to clean up any incomplete messages
    // subclasses should override, as needed
  }

}.initThisClass());