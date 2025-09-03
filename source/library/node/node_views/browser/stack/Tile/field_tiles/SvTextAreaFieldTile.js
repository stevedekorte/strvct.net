/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvTextAreaFieldTile
 * @extends SvFieldTile
 * @classdesc SvTextAreaFieldTile is a specialized field tile for text area input.
 * It includes functionality for speech-to-text input.
 */

"use strict";

(class SvTextAreaFieldTile extends SvFieldTile {
    
    /**
     * Initializes the prototype slots for the SvTextAreaFieldTile.
     */
    initPrototypeSlots () {
        /**
         * @member {ButtonView} sttButton - Button for speech to text functionality.
         * @category UI
         */
        {
            const slot = this.newSlot("sttButton", null);
            slot.setSlotType("ButtonView");
        }

        /**
         * @member {SpeechToTextSession} sttSession - Session for managing speech to text conversion.
         * @category Speech Recognition
         */
        {
            const slot = this.newSlot("sttSession", null); 
            slot.setSlotType("SpeechToTextSession");
        }
    }

    /**
     * Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * Initializes the SvTextAreaFieldTile instance.
     * @returns {SvTextAreaFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");

        this.setupValueViewButton();
        return this
    }

    /**
     * Creates and configures the value view for the text area.
     * @returns {TextField} The configured value view.
     * @category UI
     */
    createValueView () {
        const v = SvTextView.clone().setElementClassName("SvTextAreaFieldValueView");
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setOverflowY("scroll");
        v.setDoesInput(false);
        v.setIsMultiline(true);
        v.setWhiteSpace("pre-wrap");
        return v;
    }

    /**
     * Sets up the button for the value view.
     * @category UI
     */
    setupValueViewButton () {
        this.valueViewContainer().setGap("1em");

        const bv = ButtonView.clone().setElementClassName("SvActionFieldView");
        bv.setBorderRadius("0.4em");
        bv.setMaxHeight("2.1em");
        bv.setHeight("2.1em");
        bv.setMinHeight(null);
        bv.setWidth("2.3em");
	    bv.setTarget(this).setAction("onClickValueButton");
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");
        bv.setPadding("0px");
        bv.setMarginTop("1px");
        bv.titleView().setIsDisplayHidden(true);
        bv.setAttribute("title", "Speech to text input")
        this.setSttButton(bv);
        this.updateSttButton();
    }

    /**
     * Synchronizes the value from the node and updates the STT button visibility.
     * @category Data Synchronization
     */
    syncValueFromNode () {
        super.syncValueFromNode();
        const show = this.getFromNodeDelegate("hasValueButton");
        if (show !== undefined) {
            this.sttButton().setParentViewIfTrue(this.valueViewContainer(), show);
            this.updateSttButton();
        }
    }

    /**
     * Checks if the microphone is currently active.
     * @returns {boolean} True if the microphone is on, false otherwise.
     * @category Speech Recognition
     */
    isMicOn () {
        if (!this.sttSession()) {
            return false;
        }
        return this.sttSession().isRecording();
    }

    /**
     * Updates the STT button icon based on the microphone state.
     * @category UI
     */
    updateSttButton () {
        const iconName = this.isMicOn() ? "Mic On" : "Mic Off";
        this.sttButton().setIconName(iconName);
    }

    /**
     * Handles the click event on the value button.
     * @category Event Handling
     */
    onClickValueButton () {
        this.log("this.isMicOn():", this.isMicOn());
        if (!this.isMicOn()) {
            this.setupSttSessionIfNeeded();
            this.sttSession().start();
        } else {
            this.sttSession().stop();
        }
        this.updateSttButton();
    }

    /**
     * Sets up the STT session if it hasn't been created yet.
     * @category Speech Recognition
     */
    setupSttSessionIfNeeded () {
        if (!this.sttSession()) {
          const stt = SpeechToTextSession.clone().setDelegate(this).setSessionLabel("ChatInputNode STT input");
          this.setSttSession(stt);
        }
    }

    /**
     * Handles interim speech recognition results.
     * @param {SpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechInterimResult (/*sttSession*/) {
        const text = this.sttSession().interimTranscript();
        this.valueView().setString(text);
        this.log("onSpeechInterimResult('" + text + "')");
    }

    /**
     * Handles final speech recognition results.
     * @param {SpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechFinal (/*sttSession*/) {

    }

    /**
     * Handles speech input and updates the value view.
     * @param {SpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechInput (sttSession) {
        const text = this.sttSession().fullTranscript();
        this.log("onSpeechInput('" + text + "')");
        if (text.length > 0) {
            const textField = this.valueView();
            textField.setValue(text);
            textField.afterEnter(null);
        }
        assert(!sttSession.isRecording());
        this.updateSttButton();
    }

    /**
     * Handles the end of speech recognition.
     * @param {SpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechEnd (/*sttSession*/) {
        this.updateSttButton()
    }

    /**
     * Handles the end of the STT session.
     * @param {SpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSessionEnd (/*sttSession*/) {
        this.updateSttButton()
    }
    
}.initThisClass());