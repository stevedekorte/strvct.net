/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class BMChatInputTile
 * @extends BMTextAreaFieldTile
 * @classdesc BMChatInputTile is a specialized tile for chat input functionality.
 */

"use strict";

(class BMChatInputTile extends BMTextAreaFieldTile {
    
    /**
     * @description Initializes prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the BMChatInputTile instance.
     * @returns {BMChatInputTile} The initialized instance.
     */
    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");
        this.setElementClassName("BMChatInputTile");
        return this
    }

    /**
     * @description Returns speakable elements.
     * @returns {Array} An array of speakable elements.
     */
    speakableElements () {
        return this.valueView().element().elementsOfTags(this.node().tagsToSpeak());
    }

    /**
     * @description Finds a speakable element with the given text.
     * @param {string} text - The text to search for.
     * @returns {Element|undefined} The found element or undefined.
     */
    speakableElementWithText (text) {
        return this.speakableElements().detect(e => e.textContent === text || e.textContent.trim() === text);
    }

    /**
     * @description Handles the speaking text event.
     * @param {Object} aNote - The notification object.
     */
    onSpeakingText (aNote) {
        const text = aNote.info();

        if (text.includes("<break time=")) {
            return;
        }

        const e = this.speakableElementWithText(text);
        assert(e, "BMChatInputTile.onSpeakingText(aNote) missing div for text [" + text + "]");
        this.unhighlightAllSentences();
        this.highlightElement(e);
    }

    /**
     * @description Unhighlights all sentences.
     * @returns {BMChatInputTile} The current instance.
     */
    unhighlightAllSentences () {
        this.speakableElements().forEach(el => this.unhighlightElement(el));
        return this;
    }

    /**
     * @description Handles the spoke text event.
     * @param {Object} aNote - The notification object.
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
     * @returns {BMChatInputTile} The current instance.
     */
    highlightElement (e) {
        e.style.opacity = 1;
        e.style.color = "rgba(255, 255, 0, 1)";
        return this;
    }

    /**
     * @description Unhighlights the given element.
     * @param {Element} e - The element to unhighlight.
     * @returns {BMChatInputTile} The current instance.
     */
    unhighlightElement (e) {
        e.style.fontWeight = "";
        e.style.opacity = "";
        e.style.color = "";
        return this;
    }

    /**
     * @description Creates and configures the value view.
     * @returns {TextField} The configured value view.
     */
    createValueView () {
        const v = TextField.clone().setElementClassName("BMChatInputTileValueView");
        
        v.setIsMergeable(true);
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0em")
        v.setOverflowX("hidden")
        v.setOverflowY("scroll")
        v.setBackgroundColor("rgba(255, 255, 255, 0.05)")
        v.setBorder("1px solid rgba(255, 255, 255, 0.02)")
        v.setBorderRadius("0.4em")
        v.setPaddingTop("0.4em")
        v.setPaddingLeft("0.4em")
        v.setPaddingRight("0.4em")
        v.setPaddingBottom("0.4em")

        v.setPaddingTop("0.4em");
        v.setPaddingBottom("0.4em");
        v.setPaddingLeft("0.8em");
        v.setPaddingRight("0.8em");

        v.setAllowsHtml(true)
        v.setWhiteSpace("normal");
        
        v.setIsMultiline(true);
        v.setDoesInput(true);
        
        v.setPaddingTop = () => { return this }
        v.setPaddingLeft = () => { return this }
        v.setPaddingRight = () => { return this }
        v.setPaddingBottom = () => { return this }
        
        v.setBackgroundColor = () => { return this }
        v.setBorder = () => {
            return this
        }
        v.syncBorder = () => {
            return this
        }
        
        v.setDoesHoldFocusOnReturn(true);
        v.setDoesInput(true);
        return v
    }

    /**
     * @description Handles the updated node event.
     * @param {Object} aNote - The notification object.
     * @returns {*} The result of the super call.
     */
    onUpdatedNode (aNote) {
        return super.onUpdatedNode(aNote)
    }

    /**
     * @description Synchronizes the tile with its node.
     * @returns {BMChatInputTile} The current instance.
     */
    syncFromNode () {
        const node = this.node();
        this.watchSender(node);
        this.syncDotsFromNode();
        super.syncFromNode();
        return this;
    }

    /**
     * @description Synchronizes the dots display based on the node's state.
     * @returns {BMChatInputTile} The current instance.
     */
    syncDotsFromNode () {
        const node = this.node();
        if (node) {
            if (node.isComplete) {
                if (node.isComplete()) {
                    this.hideDots();
                } else {
                    this.showDots();
                }
            }
        }
        return this;
    }

    /**
     * @description Shows the animated dots.
     * @returns {BMChatInputTile} The current instance.
     */
    showDots () {
        const view = this.valueView();
        view.setCssProperty("--div-after-display", "inline-block");
        view.setCssProperty("--div-after-animation", "dotty steps(1,end) 1s infinite");
        return this;
    }

    /**
     * @description Hides the animated dots.
     * @returns {BMChatInputTile} The current instance.
     */
    hideDots () {
        const view = this.valueView();
        view.setCssProperty("--div-after-display", "none");
        view.setCssProperty("--div-after-animation", "none");
        return this;
    }
    
}.initThisClass());