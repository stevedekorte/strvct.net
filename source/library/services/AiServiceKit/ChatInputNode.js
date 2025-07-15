/**
 * @module library.services.AiServiceKit
 */

/**
 * @class ChatInputNode
 * @extends SvTextAreaField
 * @classdesc ChatInputNode for handling chat input functionality.
 */
(class ChatInputNode extends SvTextAreaField {
  /**
   * Initialize prototype slots
   * @private
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Object} conversation - The conversation object
     * @category Conversation
     */
    {
      const slot = this.newSlot("conversation", null); 
      slot.setInspectorPath("")
      slot.setSyncsToView(true)
      slot.setSlotType("Object");
    }

    /**
     * @member {Boolean} hasValueButton - Indicates if the node has a value button
     * @category UI
     */
    {
      const slot = this.newSlot("hasValueButton", false);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true);
    }

    /**
     * @member {Boolean} isMicOn - Indicates if the microphone is on
     * @category Audio
     */
    {
      const slot = this.newSlot("isMicOn", false);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true);
    }

    /*
    {
      const slot = this.newSlot("sttSession", null);
    }
    */
  }

  /**
   * Initialize the prototype
   * @private
   * @category Initialization
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

    this.setNodeTileClassName("SvChatInputTile");
    this.setKeyIsVisible(false);
    this.setValue("");
    this.setCanDelete(true);
  }

  /*
  didUpdateSlotValue (oldValue, newValue) {
    super.didUpdateSlotValue(oldValue, newValue);
    return this;
  }
  */

  /**
   * Set the value of the chat input
   * @param {string} v - The value to set
   * @returns {ChatInputNode} - Returns this instance
   * @category Input
   */
  setValue (v) {
    assert(Type.isString(v), this.type() + " setValue() requires a string");
    super.setValue(v);
    return this;
  }

  /**
   * Handle the event when the value is edited
   * @param {Object} valueView - The view object
   * @category Event Handling
   */
  onDidEditValue (/*valueView*/) {
    this.conversation().onChatEditValue(this.value());
  }

  /**
   * Check if the node accepts value input
   * @returns {boolean} - Returns true if the node accepts value input
   * @category Input
   */
  acceptsValueInput () {
    return this.conversation() && this.conversation().acceptsChatInput();
  }

  /**
   * Handle the value input event
   * @param {Object} changedView - The changed view object
   * @category Event Handling
   */
  onValueInput (/*changedView*/) {
    if (this.value()) {
      this.send();
    }
  }

  /**
   * Send the chat input value
   * @category Communication
   */
  send () {
    const v = this.value();
    this.conversation().onChatInputValue(v);
    this.setValue(""); 
    this.scheduleSyncToView();
  }

  /*

  valueButtonIconName () {
    return this.isMicOn() ? "Mic On" : "Mic Off";
  }

  onClickValueButton () {
    this.setIsMicOn(!this.isMicOn());
    console.log("this.isMicOn():", this.isMicOn());
    if (this.isMicOn()) {
      this.setupSttSessionIfNeeded();
      this.sttSession().start();
    } else {
      if (this.sttSession()) {
        this.sttSession().stop();
      }
    }
    this.didUpdateNode();
  }
  */

  /*
  disable () {
    //this.setValueIsEditable(false);
    return this;
  }

  enable () {
    //this.setValueIsEditable(true);
    return this;
  }
  */

}.initThisClass());