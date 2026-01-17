"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class ConversationMessage
 * @extends SvTextAreaField
 * @classdesc Represents a message in a conversation.
 */
(class ConversationMessage extends SvTextAreaField {

    /**
   * Initialize prototype slots for the ConversationMessage class.

   */
    initPrototypeSlots () {

        /**
     * @member {String} key - The key of the message (speaker name).
     * @category Data
     */
        {
            const slot = this.overrideSlot("key", null);
            slot.setShouldJsonArchive(true);
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {String} value - The value or content of the message.
     * @category Data
     */
        {
            const slot = this.overrideSlot("value", "");
            //slot.setInitValue("");
            slot.setShouldJsonArchive(true);
            slot.setCanInspect(true);
            slot.setInspectorPath("Node/Field/Value");
            slot.setSlotType("String");
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {Conversation} conversation - The conversation this message belongs to.
     * @category Relationship
     */
        {
            const slot = this.newSlot("conversation", null);
            slot.setCanInspect(false);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Conversation");
        }

        /**
     * @member {String} messageId - The unique identifier of the message.
     * @category Identification
     */
        {
            const slot = this.newSlot("messageId", null);
            slot.setShouldJsonArchive(true);
            slot.setCanInspect(true);
            slot.setInspectorPath("ConversationMessage");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {String} senderId - The identifier of the sender.
     * @category Identification
     */
        {
            const slot = this.newSlot("senderId", null);
            slot.setSlotType("String");
            slot.setCanInspect(true);
            slot.setInspectorPath("ConversationMessage");
            slot.setShouldStoreSlot(true);
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {String} inReplyToMessageId - The identifier of the message this is replying to.
     * @category Relationship
     */
        {
            const slot = this.newSlot("inReplyToMessageId", null);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanInspect(true);
            slot.setInspectorPath("ConversationMessage");
            slot.setSlotType("String");
            slot.setShouldJsonArchive(true);
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {Number} timestamp - The timestamp of the message.
     * @category Metadata
     */
        {
            const slot = this.newSlot("timestamp", null);
            slot.setCanInspect(true);
            slot.setDuplicateOp("duplicate");
            slot.setInspectorPath("ConversationMessage");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {Boolean} isComplete - Indicates if the message is complete.
     * @category State
     */
        {
            const slot = this.newSlot("isComplete", false);
            slot.setShouldJsonArchive(true);
            slot.setCanInspect(true);
            slot.setInspectorPath("ConversationMessage");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(true);
        }

        /**
     * @member {Error} error - Any error associated with the message.
     * @category Error Handling
     */
        {
            const slot = this.newSlot("error", null);
            slot.setCanInspect(false);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Error");
        }

        /**
     * @member {Boolean} isVisibleToUser - Indicates if the message is visible to the user.
     * @category UI
     */
        {
            const slot = this.newSlot("isVisibleToUser", true);
            slot.setCanInspect(true);
            slot.setInspectorPath("ConversationMessage");
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
     * @member {Object} delegate - The delegate object for the message.
     * @category Delegate
     */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setCanInspect(false);
            slot.setShouldStoreSlot(false);
        }

        /**
     * @member {Action} deleteAction - The action to delete the message.
     * @category Action
     */
        {
            const slot = this.newSlot("deleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setCanInspect(true);
            slot.setActionMethodName("delete");
        }

        {
            const slot = this.newSlot("markAsCompleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Mark as Complete");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setCanInspect(true);
            slot.setActionMethodName("markAsComplete");
        }

        /**
     * @member {Action} deleteFollowingMessagesAction - The action to delete following messages.
     * @category Action
     */
        {
            const slot = this.newSlot("deleteFollowingMessagesAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete Following Messages");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setCanInspect(true);
            slot.setActionMethodName("deleteFollowingMessages");
        }
    }

    /**
   * Initialize the prototype of the ConversationMessage class.
   */
    initPrototype () {
        this.setNodeTileClassName("SvChatMessageTile");
        //this.setOverrideSubviewProto(this.nodeTileClass());
        this.setKeyIsVisible(true);
        this.setValueIsEditable(false);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(false);
    }

    /**
   * Perform final initialization of the ConversationMessage instance.
   */
    finalInit () {
        super.finalInit();
        this.createIdIfAbsent();
        this.setCanDelete(false);
    }

    /**
   * Create a message ID if it doesn't exist.

   * @category Initialization
   */
    createIdIfAbsent () {
        if (!this.messageId()) {
            this.setMessageId(Object.newUuid());
        }
    }

    /**
   * Mark the message as complete.

   * @category Action
   */
    markAsComplete () {
        if (!this.isComplete()) {
            this.setIsComplete(true); // will send onMessageComplete
            //this.sendDelegateMessage("onMessageComplete");
        }
        return this;
    }

    requiresCompletionBeforeUserResponse () {
        return true;
    }


    // --- error handling ---

    hasError () {
        return this.error() !== null;
    }

    didUpdateSlotError (/*oldValue, newValue*/) {
        this.sendDelegateMessage("onMessageError", this);
    }

    /**
   * Get the message this message is replying to.

   * @returns {ConversationMessage|null} The message being replied to, or null if none.
   * @category Relationship
   */
    inReplyToMessage () {
        const id = this.inReplyToMessageId();
        if (id) {
            return this.conversation().messageWithId(id);
        }
        return null;
    }

    /**
   * Gets the JSON history for the request.

   * @returns {Array} An array of message JSON objects.
   * @category Data
   */
    jsonHistory () {
    // subclasses can override this to modify the history sent with the request
        const messages = this.visiblePreviousMessages();
        let jsonHistory = messages.map(m => m.messagesJson());
        if (this.conversation().onFilterJsonHistory) {
            jsonHistory = this.conversation().onFilterJsonHistory(jsonHistory);
        }
        return jsonHistory;
    }


    /**
   * Get the replies to this message.

   * @returns {Array} An array of messages that are replies to this message.
   * @category Relationship
   */
    replies () {
        const mid = this.messageId();
        return this.conversation().messages().select(m => m.inReplyToMessageId() === mid);
    }

    /**
   * Handle updates to the isComplete slot.

   * @param {*} oldValue - The old value of isComplete.
   * @param {*} newValue - The new value of isComplete.
   * @category State
   */
    didUpdateSlotIsComplete (oldValue, newValue) {
        if (newValue === true && this.conversation()) { // so not called during deserialization
            this.scheduleMethod("onComplete");
        }
    }

    shouldRequestResponseOnComplete () {
        return this.isUserMessage();
    }

    isUserMessage () {
        return this.role() === "user";
    }

    /**
   * Handle completion of the message.

   * @category State
   */
    onComplete () {
    // to be overridden by subclasses
        this.sendDelegateMessage("onMessageComplete");
        if (this.shouldRequestResponseOnComplete()) {
            this.requestResponse();
        }
    }

    valueCanUserSelect () {
        return true;
    }

    /**
   * Check if the value is editable.

   * @returns {Boolean} True if the value is editable, false otherwise.
   * @category UI
   */
    valueIsEditable () {
        return this._valueIsEditable && !this.isComplete();
    }

    /**
   * Set whether to send in conversation.

   * @param {*} v - The value to set.
   * @category UI
   */
    setSendInConversation (/*v*/) {
    // no-op
    }

    /**
   * Get the content of the message.

   * @returns {String} The content of the message.
   * @category Data
   */
    content () {
        return this.value();
    }

    /**
   * Set the value of the message.

   * @param {String} s - The value to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   * @category Data
   */
    setValue (s) {
    //assert(Type.isString(s), this.svType() + " setValue() requires a string");
        super.setValue(s);
        this.directDidUpdateNode(); // so updates trigger UI refresh
        return this;
    }

    /**
   * Set the content of the message.

   * @param {String} s - The content to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   * @category Data
   */
    setContent (s) {
        this.setValue(s);
        //this.directDidUpdateNode()
        return this;
    }

    /**
   * Get the subtitle of the message.

   * @returns {String} The subtitle of the message.
   * @category UI
   */
    subtitle () {
        let s = this.content();
        const max = 40;
        if (s.length > max) {
            s = this.content().slice(0, max) + "...";
        }
        return this.speakerName() + "\n" + s;
    }

    /**
   * Get the speaker name.

   * @returns {String} The speaker name.
   * @category Data
   */
    speakerName () {
        return this.key();
    }

    /**
   * Set the speaker name.

   * @param {String} s - The speaker name to set.
   * @returns {ConversationMessage} The ConversationMessage instance.
   * @category Data
   */
    setSpeakerName (s) {
        return this.setKey(s);
    }

    /**
   * Get visible previous messages.

   * @returns {Array} An array of visible previous messages.
   * @category Relationship
   */
    visiblePreviousMessages () {
    // subclasses should override for different behaviors
        return this.previousMessages();
    }

    /**
   * Get previous messages.

   * @returns {Array} An array of previous messages.
   * @category Relationship
   */
    previousMessages () {
        const msgs = this.conversation().messages();
        assert(msgs.includes(this));
        return msgs.before(this);
    }

    /**
   * Get previous messages including this message.

   * @returns {Array} An array of previous messages including this message.
   * @category Relationship
   */
    previousMessagesIncludingSelf () {
        const messages = this.previousMessages();
        messages.push(this);
        return messages;
    }

    /**
   * Get the previous message.

   * @returns {ConversationMessage|null} The previous message or null if none.
   * @category Relationship
   */
    previousMessage () {
        const messages = this.conversation().messages();
        const i = messages.indexOf(this);
        if (i > -1) {
            return messages[i - 1];
        }
        return null;
    }

    /**
   * Get following messages.

   * @returns {Array} An array of following messages.
   * @category Relationship
   */
    followingMessages () {
        return this.conversation().messages().after(this);
    }

    /**
   * Get following messages including this message.

   * @returns {Array} An array of following messages including this message.
   * @category Relationship
   */
    followingMessagesIncludingSelf () {
        const messages = this.followingMessages();
        messages.unshift(this);
        return messages;
    }

    /**
   * Delete following messages.

   * @returns {ConversationMessage} The ConversationMessage instance.
   * @category Action
   */
    deleteFollowingMessages () {
        const messages = this.followingMessages();
        messages.forEach(m => m.delete());
        return this;
    }

    /**
   * Send the message.

   * @category Action
   */
    send () {
    }

    /**
   * Get the value error.

   * @returns {String|null} The error message or null if no error.
   * @category Error Handling
   */
    valueError () {
        const e = this.error();
        return e ? e.message : null;
    }

    /**
   * Handle value input.

   * @category UI
   */
    onValueInput () {
        this.requestResponse();
    }

    /**
   * Get the delegate.

   * @returns {Object} The delegate object.
   * @category Delegate
   */
    delegate () {
        if (!this._delegate) {
            return this.conversation();
        }
        return this._delegate;
    }

    /**
   * Clean up if the message is incomplete.
   * @category Maintenance
   */
    cleanupIfIncomplete () {
    // called on startup to clean up any incomplete messages
    // subclasses should override, as needed
    }

    // --- JSON Serialization ---
    // Override SvField.asJson() which just returns the value.
    // We need the full JSON object with all message properties for cloud sync.

    /**
     * @description Returns the JSON representation of this message.
     * Overrides SvField.asJson() to use JsonGroup's calcJson() for proper serialization.
     * @returns {Object} JSON object with all message properties
     * @category JSON
     */
    asJson () {
        return this.calcJson();
    }

    /**
     * @description Returns the JSON representation for cloud storage.
     * @returns {Object} JSON object with all message properties
     * @category JSON
     */
    asCloudJson () {
        return this.calcJson({
            slots: this.thisClass().cloudJsonSchemaSlots(),
            jsonMethodName: "asCloudJson"
        });
    }

}.initThisClass());
