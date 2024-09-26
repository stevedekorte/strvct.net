/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class BMTextAreaFieldTile
 * @extends BMFieldTile
 * @classdesc BMTextAreaFieldTile is a specialized field tile for text area input.
 * It includes functionality for speech-to-text input.
 */

"use strict";

(class BMTextAreaFieldTile extends BMFieldTile {
    
    /**
     * Initializes the prototype slots for the BMTextAreaFieldTile.
     */
    initPrototypeSlots () {
        /**
         * @member {ButtonView} sttButton - Button for speech to text functionality.
         */
        {
            const slot = this.newSlot("sttButton", null);
            slot.setSlotType("ButtonView");
        }

        /**
         * @member {SpeechToTextSession} sttSession - Session for managing speech to text conversion.
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
     * Initializes the BMTextAreaFieldTile instance.
     * @returns {BMTextAreaFieldTile} The initialized instance.
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
     */
    createValueView () {
        const v = TextField.clone().setElementClassName("BMTextAreaFieldValueView");
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
        return v;
    }

    /**
     * Sets up the button for the value view.
     */
    setupValueViewButton () {
        this.valueViewContainer().setGap("1em");

        const bv = ButtonView.clone().setElementClassName("BMActionFieldView");
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
     */
    isMicOn () {
        if (!this.sttSession()) {
            return false;
        }
        return this.sttSession().isRecording();
    }

    /**
     * Updates the STT button icon based on the microphone state.
     */
    updateSttButton () {
        const iconName = this.isMicOn() ? "Mic On" : "Mic Off";
        this.sttButton().setIconName(iconName);
    }

    /**
     * Handles the click event on the value button.
     */
    onClickValueButton () {
        console.log("this.isMicOn():", this.isMicOn());
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
     */
    onSpeechInterimResult (sttSession) {
        const text = this.sttSession().interimTranscript();
        this.valueView().setString(text);
        console.log("onSpeechInterimResult('" + text + "')");
    }

    /**
     * Handles final speech recognition results.
     * @param {SpeechToTextSession} sttSession - The STT session.
     */
    onSpeechFinal (sttSession) {

    }

    /**
     * Handles speech input and updates the value view.
     * @param {SpeechToTextSession} sttSession - The STT session.
     */
    onSpeechInput (sttSession) {
        const text = this.sttSession().fullTranscript();
        console.log("onSpeechInput('" + text + "')");
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
     */
    onSpeechEnd (sttSession) {
        this.updateSttButton()
    }

    /**
     * Handles the end of the STT session.
     * @param {SpeechToTextSession} sttSession - The STT session.
     */
    onSessionEnd (sttSession) {
        this.updateSttButton()
    }
    
}.initThisClass());