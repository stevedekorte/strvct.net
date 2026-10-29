/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvTextAreaFieldTile
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
         * @member {SvButtonView} sttButton - Button for speech to text functionality.
         * @category UI
         */
        {
            const slot = this.newSlot("sttButton", null);
            slot.setSlotType("SvButtonView");
        }

        /**
         * @member {SvSpeechToTextSession} sttSession - Session for managing speech to text conversion.
         * @category Speech Recognition
         */
        {
            const slot = this.newSlot("sttSession", null);
            slot.setSlotType("SvSpeechToTextSession");
        }

        /**
         * @member {SvButtonView} leftButton - Button for the left side of the input (e.g. narration toggle).
         * @category UI
         */
        {
            const slot = this.newSlot("leftButton", null);
            slot.setSlotType("SvButtonView");
        }

        /**
         * @member {Map} inputButtonViews - the node's further input buttons, by id (see SvChatInputNode.inputButtons).
         * @category UI
         */
        {
            const slot = this.newSlot("inputButtonViews", null);
            slot.setSlotType("Map");
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
        this.setupLeftButton();
        this.setInputButtonViews(new Map());
        return this;
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
        // hidden, not scroll: the view grows with its text (height auto), so
        // it never scrolls, and "scroll" drew an empty scrollbar track beside
        // every message wherever macOS shows classic scroll bars (a mouse
        // attached, or "Show scroll bars: Always") — white bars in Safari
        v.setOverflowY("hidden");
        v.setDoesInput(false);
        v.setIsMultiline(true);
        v.setWhiteSpace("pre-wrap");
        return v;
    }

    /**
     * Creates an icon-only SvButtonView configured for use in the input area.
     * @param {string} action - The action method name for click handling.
     * @returns {SvButtonView} The configured button.
     * @category UI
     */
    newIconButton (action) {
        const bv = SvButtonView.clone().setElementClassName("SvActionFieldView");
        bv.setBorderRadius("0.4em");
        bv.setHeight("2.1em");
        bv.setMaxHeight("2.1em");
        bv.setMinHeight("2.1em");
        bv.setWidth("2.3em");
        bv.setTarget(this).setAction(action);
        bv.setBoxSizing("border-box");
        bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");
        bv.setPaddingTop("0px");
        bv.setPaddingBottom("0px");
        bv.setPaddingLeft("0px");
        bv.setPaddingRight("0px");
        bv.titleView().setIsDisplayHidden(true);
        bv.subtitleView().setIsDisplayHidden(true);
        bv.iconView().setMinAndMaxWidth(16);
        bv.iconView().setMinAndMaxHeight(16);
        bv.iconView().flexCenterContent();
        return bv;
    }

    /**
     * Sets up the button for the value view.
     * @category UI
     */
    setupValueViewButton () {
        this.valueViewContainer().setGap("1em");
        const bv = this.newIconButton("onClickValueButton");
        bv.setAttribute("title", "Speech to text input");
        this.setSttButton(bv);
        this.updateSttButton();
    }

    /**
     * Sets up the left button for the input area.
     * @category UI
     */
    setupLeftButton () {
        const bv = this.newIconButton("onClickLeftButton");
        bv.setOrder(-1); // positions it before the text area in the flex row
        this.setLeftButton(bv);
    }

    /**
     * Updates the left button icon and opacity based on node state.
     * @category UI
     */
    updateLeftButton () {
        const iconName = this.getFromNodeDelegate("leftButtonIconName");
        const isOn = this.getFromNodeDelegate("isLeftButtonOn");
        if (iconName) {
            this.leftButton().setIconName(iconName);
        }
        this.leftButton().setOpacity(isOn ? 1 : 0.3);
    }

    /**
     * Handles click on the left button, delegating to the node.
     * @category Event Handling
     */
    onClickLeftButton () {
        const node = this.node();
        if (node && node.onClickLeftButton) {
            node.onClickLeftButton();
        }
    }

    /**
     * Synchronizes the value from the node and updates button visibility.
     * @category Data Synchronization
     */
    syncValueFromNode () {
        super.syncValueFromNode();
        const show = this.getFromNodeDelegate("hasValueButton");
        if (show !== undefined) {
            this.sttButton().setParentViewIfTrue(this.valueViewContainer(), show);
            this.updateSttButton();
        }

        const showLeft = this.getFromNodeDelegate("hasLeftButton");
        if (showLeft !== undefined) {
            this.leftButton().setParentViewIfTrue(this.valueViewContainer(), showLeft);
            this.updateLeftButton();
        }
        this.syncInputButtons();
    }

    /**
     * Makes the further input buttons match the node's (by id): adds, updates
     * and removes them, placed after the left button.
     * @category UI
     */
    syncInputButtons () {
        const infos = this.getFromNodeDelegate("inputButtons") || [];
        const ids = new Set(infos.map(info => info.id));
        this.inputButtonViews().forEach((bv, id) => {
            if (!ids.has(id)) {
                this.valueViewContainer().removeSubviewIfPresent(bv);
                this.inputButtonViews().delete(id);
            }
        });
        infos.forEach(info => this.updateInputButton(this.inputButtonViewFor(info.id), info));
    }

    inputButtonViewFor (id) {
        let bv = this.inputButtonViews().get(id);
        if (!bv) {
            bv = this.newIconButton("onClickInputButtonView");
            bv.setOrder(-1); // before the text area, after the left button (added earlier)
            bv.setInfo(id);
            this.inputButtonViews().set(id, bv);
            this.valueViewContainer().addSubview(bv);
        }
        return bv;
    }

    updateInputButton (bv, info) {
        if (info.iconName) {
            bv.setIconName(info.iconName);
        }
        bv.setOpacity(info.isOn ? 1 : 0.3);
        bv.setAttribute("title", info.title || "");
        bv.setAttribute("aria-label", info.title || "");
    }

    /**
     * An input button was clicked: tells the node which.
     * @param {SvButtonView} bv
     * @category Event Handling
     */
    onClickInputButtonView (bv) {
        const node = this.node();
        if (node && node.onClickInputButton) {
            node.onClickInputButton(bv.info());
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
        console.log(this.logPrefix(), "this.isMicOn():", this.isMicOn());
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
            const stt = SvSpeechToTextSession.clone().setDelegate(this).setSessionLabel("SvChatInputNode STT input");
            this.setSttSession(stt);
        }
    }

    /**
     * Handles interim speech recognition results.
     * @param {SvSpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechInterimResult (/*sttSession*/) {
        const text = this.sttSession().interimTranscript();
        this.valueView().setString(text);
        console.log(this.logPrefix(), "onSpeechInterimResult('" + text + "')");
    }

    /**
     * Handles final speech recognition results.
     * @param {SvSpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechFinal (/*sttSession*/) {

    }

    /**
     * Handles speech input and updates the value view.
     * @param {SvSpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechInput (sttSession) {
        const text = this.sttSession().fullTranscript();
        console.log(this.logPrefix(), "onSpeechInput('" + text + "')");
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
     * @param {SvSpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSpeechEnd (/*sttSession*/) {
        this.updateSttButton();
    }

    /**
     * Handles the end of the STT session.
     * @param {SvSpeechToTextSession} sttSession - The STT session.
     * @category Speech Recognition
     */
    onSessionEnd (/*sttSession*/) {
        this.updateSttButton();
    }

}.initThisClass());
