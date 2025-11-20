/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
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
        e.style.color = "rgba(255, 255, 0, 1)";
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
        v.setBackgroundColor("rgba(255, 255, 255, 0.05)");
        v.setBorder("1px solid rgba(255, 255, 255, 0.02)");
        v.setBorderRadius("0.4em");
        v.setPaddingTop("0.4em");
        v.setPaddingLeft("0.4em");
        v.setPaddingRight("0.4em");
        v.setPaddingBottom("0.4em");

        v.setPaddingTop("0.4em");
        v.setPaddingBottom("0.4em");
        v.setPaddingLeft("0.8em");
        v.setPaddingRight("0.8em");

        v.setAllowsHtml(true);
        v.setWhiteSpace("normal");

        v.setIsMultiline(true);
        v.setDoesInput(true);

        v.setPaddingTop = () => { return this; };
        v.setPaddingLeft = () => { return this; };
        v.setPaddingRight = () => { return this; };
        v.setPaddingBottom = () => { return this; };

        v.setBackgroundColor = () => { return this; };
        v.setBorder = () => {
            return this;
        };
        v.syncBorder = () => {
            return this;
        };

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
     * @description Synchronizes the tile with its node.
     * @returns {SvChatInputTile} The current instance.
     * @category Synchronization
     */
    syncFromNode () {
        const node = this.node();
        this.watchSender(node);
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

}.initThisClass());
