/**
 * @module library.services.AiServiceKit
 */

/**
 * @class SvChatInputNode
 * @extends SvTextAreaField
 * @classdesc SvChatInputNode for handling chat input functionality.
 */
(class SvChatInputNode extends SvTextAreaField {
    /**
   * Initialize prototype slots
   * @private
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Object} conversation - The conversation object
     * @category SvConversation
     */
        {
            const slot = this.newSlot("conversation", null);
            slot.setInspectorPath("");
            slot.setSyncsToView(true);
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

        /**
     * @member {Boolean} hasLeftButton - Indicates if the node has a left button
     * @category UI
     */
        {
            const slot = this.newSlot("hasLeftButton", false);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
     * @member {Boolean} isLeftButtonOn - Indicates if the left button is in the "on" state
     * @category UI
     */
        {
            const slot = this.newSlot("isLeftButtonOn", false);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
     * @member {String} leftButtonIconName - Icon name for the left button
     * @category UI
     */
        {
            const slot = this.newSlot("leftButtonIconName", null);
            slot.setSlotType("String");
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
   * @returns {SvChatInputNode} - Returns this instance
   * @category Input
   */
    setValue (v) {
        assert(Type.isString(v), this.svType() + " setValue() requires a string");
        super.setValue(v);
        return this;
    }

    /**
   * Handle the event when the value is edited
   * @param {Object} valueView - The view object
   * @category Event Handling
   */
    onDidEditValue (valueView) {
        // Read the LIVE view value, not this.value(): onDidEdit only
        // SCHEDULES the view->node sync before calling this hook, so the
        // node's own value lags one edit behind. Reading the stale value
        // meant the final deletion reported the previous (non-empty) text
        // — typing-draft delete-all never fired and the "<name>: …"
        // placeholder stuck on every other participant's screen.
        const v = (valueView && typeof valueView.value === "function") ? valueView.value() : this.value();
        this.conversation().onChatEditValue(v);
        // The Enter gate can be CONTENT-dependent (acceptsChatInputForText —
        // e.g. party-chat drafts are sendable while the AI is busy), so each
        // edit re-evaluates it. The tile's focused-sync guard refreshes
        // canHitEnter without touching the editor's text or caret.
        this.scheduleSyncToView();
    }

    /**
   * Check if the node accepts value input
   * @returns {boolean} - Returns true if the node accepts value input
   * @category Input
   */
    acceptsValueInput () {
        const c = this.conversation();
        if (!c) {
            return false;
        }
        // Content-aware when the conversation supports it: some messages
        // (e.g. party chat that never touches the AI loop) are sendable even
        // while the AI is busy. The conversation owns that judgment.
        if (typeof c.acceptsChatInputForText === "function") {
            return c.acceptsChatInputForText(this.value());
        }
        return c.acceptsChatInput();
    }

    /**
   * Diagnostic: why this input is currently refusing input (acceptsValueInput()
   * is false), or null when it accepts. Delegates to the conversation, which owns
   * the gating decision; the field tile reads this to log what we're waiting on at
   * the moment it disables the input.
   * @returns {String|null} - The blocking reason, or null if input is accepted.
   * @category Input
   */
    valueInputBlockingReason () {
        const c = this.conversation();
        return (c && typeof c.chatInputBlockingReason === "function") ? c.chatInputBlockingReason() : null;
    }

    /**
   * Handle the value input event
   * @param {Object} changedView - The changed view object
   * @category Event Handling
   */
    onValueInput (/*changedView*/) {
        if (this.value()) {
            // now that we support shift-return, we'll need to convert returns to <br> tags
            const v = this.value().replace(/\n/g, "<br>");
            this.setValue(v);
            this.send();
        }
    }

    /**
   * Send the chat input value
   * @category Communication
   */
    send () {
        const v = this.value();
        const accepted = this.conversation().onChatInputValue(v);
        if (accepted === false) {
            // Refused (e.g. AI busy): keep the typed text so nothing is lost —
            // the user can send it when the gate reopens.
            return;
        }
        this.setValue("");
        // The input view is still focused after Enter; the tile's focused
        // guard (SvChatInputTile.syncValueFromNode) would normally refuse
        // to overwrite a focused editor — this one-shot flag authorizes
        // the post-send clear.
        this._forceValueViewSync = true;
        this.scheduleSyncToView();
    }

    /**
   * Handles click on the left button by delegating to the conversation.
   * @category Event Handling
   */
    onClickLeftButton () {
        if (this.conversation() && this.conversation().onClickChatLeftButton) {
            this.conversation().onClickChatLeftButton();
        }
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
