/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvChatInputTile
 * @extends SvChatMessageTile
 * @classdesc SvChatInputTile is a specialized tile for chat input functionality.


 */


"use strict";

(class SvChatInputTile extends SvChatMessageTile {

    initPrototypeSlots () {
        /**
         * @member {SvDomView} accessoryContainer - holds the node's accessory
         * view, floating just above the input row (over the bottom of the
         * conversation).
         * @category Accessory
         */
        {
            const slot = this.newSlot("accessoryContainer", null);
            slot.setSlotType("SvDomView");
        }

        /**
         * @member {SvNodeView} accessoryView - the view for
         * node.accessoryNode() (its node tile class — any SvNodeView).
         * @category Accessory
         */
        {
            const slot = this.newSlot("accessoryView", null);
            slot.setSlotType("SvNodeView");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Array} accessoryHoverListeners - mouse listeners on the left
         * button and the accessory, for the hover preview.
         * @category Accessory
         */
        {
            const slot = this.newSlot("accessoryHoverListeners", null);
            slot.setSlotType("Array");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Boolean} isAccessoryHovered - the pointer is over the left
         * button or the accessory (hover preview).
         * @category Accessory
         */
        {
            const slot = this.newSlot("isAccessoryHovered", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isAccessoryHoverSuppressed - a left-button click
         * decided the accessory's state; hover stays out of it until the
         * pointer leaves.
         * @category Accessory
         */
        {
            const slot = this.newSlot("isAccessoryHoverSuppressed", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setupAccessoryContainer();
        return this;
    }

    /**
     * @description Syncs from the node, then the accessory above the input.
     * @returns {SvChatInputTile} The current instance.
     * @category Sync
     */
    syncFromNode () {
        super.syncFromNode();
        this.syncAccessory();
        return this;
    }

    /**
     * @description Value sync with a focused guard. While the user is
     * typing, the node's value legitimately lags the view (the view->node
     * sync is scheduled, not immediate) — so any didUpdateNode ripple
     * (AI streaming chunks, multiplayer message updates, presence ticks)
     * that re-synced this tile would overwrite the contenteditable with
     * STALE text, destroying the selection (cursor jumps to position 0)
     * and dropping just-typed characters. While focused, the view is the
     * source of truth — skip the value write, but still sync the
     * non-value aspects (editability follows acceptsChatInput).
     * Programmatic clears (send) set the node's one-shot
     * _forceValueViewSync flag to override.
     * @returns {SvChatInputTile} The current instance.
     * @category Sync
     */
    syncValueFromNode () {
        const node = this.node();
        const valueView = this.valueView();

        // Debug: when the chat input is gated, log what the model says we're
        // waiting on — so an input that "locks up" reports its reason instead of
        // silently disabling. The model owns the reason
        // (node.valueInputBlockingReason -> conversation.chatInputBlockingReason);
        // the view only reads + logs it. De-duped against the last logged reason
        // so we capture the full trace (including the reason CHANGING while still
        // disabled, e.g. AI-streaming -> pending roll) without per-sync spam.
        // Lives here (not the generic SvFieldTile) because this tile's focused
        // guard below can return before super runs.
        if (node && typeof node.valueInputBlockingReason === "function") {
            const reason = node.acceptsValueInput && node.acceptsValueInput() ? null : node.valueInputBlockingReason();
            if (reason && reason !== this._lastLoggedInputBlockReason) {
                console.log(this.logPrefix(), "chat input disabled — waiting on:", reason);
            }
            this._lastLoggedInputBlockReason = reason;
        }
        // The editor's placeholder (data-placeholder CSS, only visible while
        // empty): while blocked it shows WHY right where the user tries to
        // act; while accepting it falls back to the node's idle placeholder
        // ("What do you do?") rather than clearing — nulling it here is what
        // made the idle placeholder never appear.
        if (valueView && valueView.setPlaceholderText && node && typeof node.valueInputBlockingHint === "function") {
            const blocked = !(node.acceptsValueInput && node.acceptsValueInput());
            const idleText = (typeof node.valuePlaceholderText === "function") ? node.valuePlaceholderText() : null;
            valueView.setPlaceholderText(blocked ? node.valueInputBlockingHint() : idleText);
        }
        const isFocused = valueView && typeof valueView.isFocused === "function" && valueView.isFocused();
        if (isFocused && node && !node._forceValueViewSync) {
            const nodeValue = this.visibleValue();
            const viewValue = (typeof valueView.value === "function") ? valueView.value() : null;
            if (nodeValue !== viewValue) {
                // Without the guard this write would have replaced the
                // editor's innerHTML mid-typing — text near-identical but
                // caret collapsed to position 0.
                console.log(this.logPrefix(), "skipped focused value sync (node lags view by", Math.abs(String(viewValue || "").length - String(nodeValue || "").length), "chars)");
            }
            if (valueView.setIsEditable && node.valueIsEditable) {
                valueView.setIsEditable(node.valueIsEditable());
            }
            // CRITICAL: also refresh whether Enter can submit. The focused guard
            // returns before super.syncValueFromNode(), which is the only other place
            // that calls setCanHitEnter(). Without this, once the input holds focus
            // (it does after you send a message and throughout the AI reply), the
            // gate re-opening on completion never restores Enter — the input is
            // model-ready (acceptsChatInput() === true) but permanently can't send
            // until a reload. Unlike the value sync, this doesn't touch the editor's
            // text/caret, so it's safe inside the focus guard.
            if (valueView.setCanHitEnter && node.acceptsValueInput) {
                valueView.setCanHitEnter(node.acceptsValueInput());
            }
            return this;
        }
        if (node) {
            node._forceValueViewSync = false; // consume the one-shot flag
        }
        return super.syncValueFromNode();
    }


    // nodeMinTileHeight min-only application inherited from SvChatMessageTile.

    // --- accessory (node.accessoryNode(), floating above the input row) ---

    /**
     * @description The container floats above the tile, anchored to its top
     * edge, so the accessory overlays the conversation instead of pushing
     * it up (the footer lets it overflow while expanded — SvNavView).
     * @category Accessory
     */
    setupAccessoryContainer () {
        const v = SvDomView.clone().setElementClassName("SvChatInputAccessory");
        v.setPosition("absolute");
        v.setBottom("100%");
        v.setLeft("0px");
        v.setRight("0px");
        v.setZIndex(10);
        v.setDisplay("none");
        this.addSubview(v);
        this.setAccessoryContainer(v);
    }

    syncAccessory () {
        const node = this.node();
        this.syncAccessoryView(node && node.accessoryNode ? node.accessoryNode() : null);
        this.syncAccessoryHoverListening();
        this.syncAccessoryVisibility();
        return this;
    }

    /**
     * @description Embeds a view for the accessory node (the node's own tile
     * class), replacing one for a previous accessory.
     * @param {SvNode|null} accessory
     * @category Accessory
     */
    syncAccessoryView (accessory) {
        const view = this.accessoryView();
        if (view && view.node() === accessory) {
            return this;
        }
        if (view) {
            view.setNode(null);
            this.accessoryContainer().removeSubview(view);
            this.setAccessoryView(null);
        }
        if (accessory) {
            const newView = accessory.nodeTileClass().clone();
            newView.setNode(accessory);
            this.accessoryContainer().addSubview(newView);
            this.setAccessoryView(newView);
        }
        return this;
    }

    syncAccessoryVisibility () {
        const node = this.node();
        const shows = !!(this.accessoryView() && node && (node.showsAccessory() || this.isAccessoryHovered()));
        this.accessoryContainer().setDisplay(shows ? "block" : "none");
        return this;
    }

    // --- hover preview (node.leftButtonRevealsAccessory) ---

    wantsAccessoryHover () {
        const node = this.node();
        return !!(node && node.leftButtonRevealsAccessory && node.leftButtonRevealsAccessory());
    }

    /**
     * @description Listens for the pointer over the left button and the
     * accessory — both, so the pointer can travel from one to the other.
     * @category Accessory
     */
    syncAccessoryHoverListening () {
        if (!this.wantsAccessoryHover() || this.accessoryHoverListeners()) {
            return this;
        }
        const targets = [this.leftButton(), this.accessoryContainer()];
        this.setAccessoryHoverListeners(targets.map(v => {
            return SvHoverListener.clone().setListenTarget(v.element()).setDelegate(this).setIsListening(true);
        }));
        return this;
    }

    /**
     * @description Only real hover (a mouse or trackpad) previews: touch
     * browsers emulate mouseover on tap, which must not stick the
     * accessory open.
     * @returns {Boolean}
     * @category Accessory
     */
    canHoverPreviewAccessory () {
        return window.matchMedia("(hover: hover)").matches && !this.isAccessoryHoverSuppressed();
    }

    onHoverOver (/*event*/) {
        if (this.canHoverPreviewAccessory()) {
            this.clearTimeoutNamed("accessoryHoverOut");
            this.setIsAccessoryHovered(true);
            this.syncAccessoryVisibility();
        }
        return true;
    }

    /**
     * @description Leaving either target hides the preview after a beat, so
     * the pointer can cross the gap between button and accessory.
     * @category Accessory
     */
    onHoverLeave (/*event*/) {
        this.addTimeout(() => {
            this.setIsAccessoryHovered(false);
            this.setIsAccessoryHoverSuppressed(false);
            this.syncAccessoryVisibility();
        }, 300, "accessoryHoverOut");
        return true;
    }

    /**
     * @description A click decides the accessory's state outright: drop the
     * hover preview so closing takes effect under the pointer.
     * @category Accessory
     */
    onClickLeftButton () {
        this.clearTimeoutNamed("accessoryHoverOut");
        this.setIsAccessoryHovered(false);
        this.setIsAccessoryHoverSuppressed(true);
        super.onClickLeftButton();
    }

    /**
     * @description The input is a CONTROL, not a selectable item: it holds
     * selection/focus almost permanently while chatting, so the theme's
     * selected/active state background painted the whole footer row as a
     * gray band. Apply theme styles normally, then keep the background
     * transparent in every state.
     * @returns {SvChatInputTile} The current instance.
     * @category Style
     */
    applyStyles () {
        super.applyStyles();
        this.contentView().setBackgroundColor("transparent");
        return this;
    }

    /**
     * @description Creates and configures the value view.
     * @returns {SvTextView} The configured value view.
     * @category UI
     */
    createValueView () {
        const v = super.createValueView();
        v.setElementClassName("SvChatInputTileValueView");

        v.setAllowsHtml(false);
        v.setWhiteSpace("pre-wrap");
        v.setMaxHeight("10em"); // growth limit (~7 lines); beyond this the editor scrolls

        v.setIsMultiline(true);
        v.setDoesInput(true);

        // Clear the editor synchronously on Enter (afterEnter, right after
        // the message is committed via didInput → onValueInput → send).
        // Previously the only clear was send()'s setValue("") + a SCHEDULED
        // model→view sync; the focused guard (syncValueFromNode above)
        // skips value writes while the input is focused, so that scheduled
        // clear was unreliable — the input often kept the just-sent text.
        // doesClearOnReturn is the framework's purpose-built, synchronous,
        // focus-independent clear for exactly this case.
        v.setDoesClearOnReturn(true);

        v.setDoesHoldFocusOnReturn(true);
        // NOT "fit-content": in CSS, min-height beats max-height, so a
        // fit-content minimum would defeat the 10em growth cap above.
        v.setMinHeight("1em");
        //v.setDoesInput(true);
        return v;
    }

}.initThisClass());
