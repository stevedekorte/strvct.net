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

        /**
     * @member {Boolean} isCollapsibleRegion - opt-in: whether this input row
     * gets an edge handle (see SvCollapsibleRegionProtocol). Off by default;
     * a conversation that wants a collapsible input enables it in its
     * setupChatInputNode override. Never stored.
     * @category Collapsible Region
     */
        {
            const slot = this.newSlot("isCollapsibleRegion", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
        }

        /**
     * @member {Boolean} isRegionExpanded - per-device presentation state:
     * whether the input row is currently shown. A session always starts
     * expanded (never stored — collapsing is a reading-mode gesture, not a
     * preference).
     * @category Collapsible Region
     */
        {
            const slot = this.newSlot("isRegionExpanded", true);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
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

        this.addProtocol(SvCollapsibleRegionProtocol);
    }

    // --- SvCollapsibleRegionProtocol (the edge pill above the input row) ---

    /**
   * @description Whether the input row is currently shown. Part of
   * SvCollapsibleRegionProtocol.
   * @returns {Boolean}
   * @category Collapsible Region
   */
    isExpanded () {
        return this.isRegionExpanded();
    }

    /**
   * @description Collapses or restores the input row (a per-device
   * reading-mode gesture — the pill on the boundary brings it back).
   * @returns {SvChatInputNode}
   * @category Collapsible Region
   */
    toggleExpanded () {
        this.setIsRegionExpanded(!this.isRegionExpanded());
        this.didUpdateNode();
        // The nav COLUMN owns the collapse (flex + fade), and it syncs from
        // its own node — the conversation — not from this footer node. Nudge
        // it, the same way the TV band nudges on fold-mode changes.
        const conversation = this.conversation();
        if (conversation && conversation.didUpdateNode) {
            conversation.didUpdateNode();
        }
        return this;
    }

    collapsibleAxis () {
        return "vertical";
    }

    /**
   * @description The handle exists only for conversations that opted in via
   * setIsCollapsibleRegion(true).
   * @returns {Boolean}
   * @category Collapsible Region
   */
    showsEdgeHandle () {
        return this.isCollapsibleRegion();
    }

    collapsibleRegionLabel () {
        return "Message box";
    }

    /*
    didUpdateSlotValue (oldValue, newValue) {
        super.didUpdateSlotValue(oldValue, newValue);
        return this;
    }
    */

    /**
   * The chat input requests a compact tile: a one-line height so the tile
   * hugs the input text instead of sitting in SvFieldTile's 5em minimum.
   * A constant (not a slot fallback) because SvViewableNode.finalInit()
   * stamps 80 into the stored slot on every load, so the stored value can
   * never carry a meaningful per-node setting. SvChatInputTile applies this
   * as a true minimum — the tile still grows with multiline text.
   * @returns {number} - The requested tile height in px
   * @category Layout
   */
    nodeMinTileHeight () {
        return 48;
    }

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
   * The idle placeholder shown while the input is empty and ACCEPTING text
   * ("What do you do?"). The conversation owns the wording; null shows no
   * placeholder. Distinct from valueInputBlockingHint, which replaces it
   * while input is blocked.
   * @returns {String|null}
   * @category Input
   */
    valuePlaceholderText () {
        const c = this.conversation();
        return (c && typeof c.chatInputPlaceholder === "function") ? c.chatInputPlaceholder() : null;
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
   * User-facing counterpart of valueInputBlockingReason: a short friendly
   * line the input tile shows as placeholder text while input is blocked
   * ("Waiting for the host to return…"). Null means no placeholder. The
   * conversation curates the wording (chatInputBlockingHint); the machine
   * reason above stays for console diagnostics.
   * @returns {String|null}
   * @category Input
   */
    valueInputBlockingHint () {
        const c = this.conversation();
        return (c && typeof c.chatInputBlockingHint === "function") ? c.chatInputBlockingHint() : null;
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
