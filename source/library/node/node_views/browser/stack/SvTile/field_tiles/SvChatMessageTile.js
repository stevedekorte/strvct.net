/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/**
 * @class SvChatMessageTile
 * @extends SvTextAreaFieldTile
 * @classdesc SvChatMessageTile is a specialized tile for chat message functionality.
 */


"use strict";

(class SvChatMessageTile extends SvTextAreaFieldTile {

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvChatInputTile instance.
     * @returns {SvChatInputTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");
        this.setElementClassName("SvChatMessageTile");

        // Accessibility: chat messages are live region content
        this.setAriaLive("polite");

        return this;
    }

    /**
     * @description Returns speakable elements.
     * @returns {Array} An array of speakable elements.
     * @category Speech
     */
    speakableElements () {
        return this.valueView().element().elementsOfTags(this.node().tagsToSpeak());
    }

    /**
     * @description Finds a speakable element with the given text.
     * @param {string} text - The text to search for.
     * @returns {Element|undefined} The found element or undefined.
     * @category Speech
     */
    speakableElementWithText (text) {
        return this.speakableElements().detect(e => e.textContent === text || e.textContent.trim() === text);
    }

    /**
     * @description Handles the speaking text event.
     * @param {Object} aNote - The notification object.
     * @category Speech
     */
    onSpeakingText (aNote) {
        const text = aNote.info();

        if (text.includes("<break time=")) {
            return;
        }

        const e = this.speakableElementWithText(text);
        assert(e, "SvChatInputTile.onSpeakingText(aNote) missing div for text [" + text + "]");
        this.unhighlightAllSentences();
        this.highlightElement(e);
    }

    /**
     * @description Unhighlights all sentences.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    unhighlightAllSentences () {
        this.speakableElements().forEach(el => this.unhighlightElement(el));
        return this;
    }

    /**
     * @description Handles the spoke text event.
     * @param {Object} aNote - The notification object.
     * @category Speech
     */
    onSpokeText (aNote) {
        const text = aNote.info();

        if (text.includes("<break time=")) {
            return;
        }

        const e = this.speakableElementWithText(text);
        assert(e);
        this.unhighlightElement(e);
    }

    /**
     * @description Highlights the given element.
     * @param {Element} e - The element to highlight.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    highlightElement (e) {
        e.style.opacity = 1;
        // The sentence currently being narrated. Hue alone is a weak signal at body
        // size — the light theme's red sits at only 1.9:1 against the body ink — so
        // the theme supplies a SECOND channel too: a wash on a light ground, a glow
        // on a dark one. Both default to inert, so a theme that wants neither gets
        // colour only. All three are paint-only; none triggers layout, which matters
        // because this runs on every sentence advance.
        e.style.color = "var(--sv-speaking-color)";
        e.style.backgroundColor = "var(--sv-speaking-bg)";
        e.style.textShadow = "var(--sv-speaking-shadow)";
        return this;
    }

    /**
     * @description Unhighlights the given element.
     * @param {Element} e - The element to unhighlight.
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    unhighlightElement (e) {
        e.style.fontWeight = "";
        e.style.opacity = "";
        e.style.color = "";
        // Must clear everything highlightElement set. Anything left behind
        // accumulates down the message as narration advances, so the whole
        // paragraph ends up wearing the active-sentence treatment.
        e.style.backgroundColor = "";
        e.style.textShadow = "";
        return this;
    }

    /**
     * @description Creates and configures the value view.
     * @returns {SvTextView} The configured value view.
     * @category UI
     */
    createValueView () {
        const v = SvTextView.clone();
        v.setElementClassName("SvChatMessageTileValueView");

        v.setIsMergeable(true);
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setOverflowY("scroll");

        // The bubble chrome (background, border, radius, padding) lives in
        // field_tiles/_css.css as token-driven rules (--sv-chat-msg-*), so a
        // theme can restyle it. Clear SvTextView.init's inline paddings AND
        // its syncBorder() inline "border: none" so the stylesheet rules
        // actually apply — an inline shorthand expands to border-left etc.
        // and silently beats any CSS rule (found via probe: the themed
        // player-message left rule matched but never rendered).
        v.setPaddingTop(null);
        v.setPaddingLeft(null);
        v.setPaddingRight(null);
        v.setPaddingBottom(null);
        v.setBorder(null);

        // Neuter the chrome setters IMMEDIATELY after the clears — the mode
        // setters below (setIsMultiline, setDoesInput, setDoesHoldFocusOnReturn)
        // trigger syncEditingControl → syncBorder("none"), which re-imposed the
        // inline border inside this very method (probe-verified). They MUST
        // return v (the value view), not the tile — callers chain them
        // (valueView.setPaddingLeft(..).setPaddingRight(..)), and returning the
        // tile made the second call style the TILE, adding a phantom right
        // padding (the mobile chat-input right-gap bug).
        v.setPaddingTop = () => { return v; };
        v.setPaddingLeft = () => { return v; };
        v.setPaddingRight = () => { return v; };
        v.setPaddingBottom = () => { return v; };

        v.setBackgroundColor = () => { return v; };
        v.setBorder = () => { return v; };
        v.syncBorder = () => { return v; };

        v.setAllowsHtml(true);
        v.setWhiteSpace("normal");

        v.setIsMultiline(true);
        v.setDoesInput(true);

        v.setDoesHoldFocusOnReturn(true);
        v.setDoesInput(true);
        v.turnOnUserSelect();
        return v;
    }

    /**
     * @description Handles the updated node event.
     * @param {Object} aNote - The notification object.
     * @returns {*} The result of the super call.
     * @category Event
     */
    onUpdatedNode (aNote) {
        return super.onUpdatedNode(aNote);
    }

    /**
     * @description Applies the node's height hint (nodeMinTileHeight) as a
     * true MINIMUM: chat tiles hug their text — replacing SvFieldTile's 5em
     * tile/contentView floors, which left dead bands above and below short
     * messages — while still growing with the content. Chat tiles apply the
     * hint THEMSELVES and it must stay that way: SvTile ignores
     * nodeMinTileHeight, and honoring it globally breaks every tile, because
     * SvViewableNode.finalInit() stamps 80 onto every node — titled tiles
     * (roll messages, headers, companion sheet) get clipped to a fixed 80px.
     * Chat message/input nodes override nodeMinTileHeight() to return a
     * compact constant.
     * @returns {SvChatMessageTile} The current instance.
     * @category Layout
     */
    updateSubviews () {
        super.updateSubviews();
        const node = this.node();
        if (node) {
            const h = node.nodeMinTileHeight();
            if (h > 0) {
                this.setMinHeightPx(h);
                this.setMaxHeight("none");
                this.contentView().setMinHeightPx(h);
            }
        }
        return this;
    }

    /**
     * @description Keeps makeOrientationRight (which runs AFTER
     * updateSubviews on every full sync) in agreement with the compact
     * minimum above — otherwise the tile's height flips between 5em and the
     * hint depending on which sync path ran last (visible as messages
     * changing height when selected/deselected).
     * @returns {String} The CSS min-height value.
     */
    orientationMinHeight () {
        const node = this.node();
        if (node && node.nodeMinTileHeight() > 0) {
            return this.pxNumberToString(node.nodeMinTileHeight());
        }
        return super.orientationMinHeight();
    }

    /**
     * @description Synchronizes the tile with its node.
     * @returns {SvChatInputTile} The current instance.
     * @category Synchronization
     */
    syncFromNode () {
        const node = this.node();
        this.watchSender(node);
        // Expose the message's role ("user" / "assistant") to CSS so themes
        // can style them differently (e.g. a left rule on player messages).
        if (node && node.role) {
            this.setAttribute("data-role", node.role());
        }
        super.syncFromNode(); // This now includes syncDotsFromNode
        // Check for backward compatibility with isComplete
        if (node && node.isComplete && !node.valueIsComplete) {
            if (node.isComplete()) {
                this.hideValueDots();
            } else {
                this.showValueDots();
            }
        }
        return this;
    }

    /**
     * @description Shows the animated dots (calls showValueDots for backward compatibility).
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    showDots () {
        return this.showValueDots();
    }

    /**
     * @description Hides the animated dots (calls hideValueDots for backward compatibility).
     * @returns {SvChatInputTile} The current instance.
     * @category UI
     */
    hideDots () {
        return this.hideValueDots();
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Chat messages are always a polite live region.
     * @returns {string} The ARIA live value.
     * @category Accessibility
     */
    ariaLive () {
        return "polite";
    }

}.initThisClass());
