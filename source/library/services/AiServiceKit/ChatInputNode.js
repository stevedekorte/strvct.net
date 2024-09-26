/**
 * @module library.services.AiServiceKit
 */

/**
 * @class ChatInputNode
 * @extends BMTextAreaField
 * @classdesc ChatInputNode for handling chat input functionality.
 */
(class ChatInputNode extends BMTextAreaField {
  /**
   * Initialize prototype slots
   * @private
   */
  initPrototypeSlots () {
    /**
     * @member {Object} conversation - The conversation object
     */
    {
      const slot = this.newSlot("conversation", null); 
      slot.setInspectorPath("")
      slot.setSyncsToView(true)
      slot.setSlotType("Object");
    }

    /**
     * @member {Boolean} hasValueButton - Indicates if the node has a value button
     */
    {
      const slot = this.newSlot("hasValueButton", false);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true);
    }

    /**
     * @member {Boolean} isMicOn - Indicates if the microphone is on
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
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

    this.setNodeTileClassName("BMChatInputTile");
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
   */
  setValue (v) {
    super.setValue(v);
    return this;
  }

  /**
   * Handle the event when the value is edited
   * @param {Object} valueView - The view object
   */
  onDidEditValue (valueView) {
    this.conversation().onChatEditValue(this.value())
  }

  /**
   * Check if the node accepts value input
   * @returns {boolean} - Returns true if the node accepts value input
   */
  acceptsValueInput () {
    return this.conversation() && this.conversation().acceptsChatInput();
  }

  /**
   * Handle the value input event
   * @param {Object} changedView - The changed view object
   */
  onValueInput (changedView) {
    if (this.value()) {
      this.send()
    }
  }

  /**
   * Send the chat input value
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