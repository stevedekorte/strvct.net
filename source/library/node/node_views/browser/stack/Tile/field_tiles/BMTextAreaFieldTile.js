"use strict";

/*

    BMTextAreaFieldTile

    
*/

(class BMTextAreaFieldTile extends BMFieldTile {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("sttButton", null); // Button, for speech to text
            slot.setSlotType("ButtonView");
        }

        {
            const slot = this.newSlot("sttSession", null); 
            slot.setSlotType("SpeechToTextSession");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.keyView().hideDisplay();
        this.setValueUneditableBorder("none");
        this.setValueEditableBorder("none");

        this.setupValueViewButton();
        return this
    }

    createValueView () {
        /* old css:
        .BMTextAreaFieldValueView {
            display: flex;
            position: relative;
            padding: 0;
            margin: 0;
            width: auto;
            min-height: auto;

            word-break: break-all;
            unicode-bidi: embed;
            white-space: pre-wrap;

            font-weight: normal;
            text-align: left;
        }
        */

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
        //v.setFontFamily("Mono");
        //v.setDoesHoldFocusOnReturn(true);
        v.setDoesInput(false);
        v.setIsMultiline(true);
        return v;
    }

    setupValueViewButton () {
        this.valueViewContainer().setGap("1em");

        //const v = ButtonView.clone().setTitle("STT").setHasOutline(true);
        const bv = ButtonView.clone().setElementClassName("BMActionFieldView");
        bv.setBorderRadius("0.4em");
        //bv.setTitle("x");
        bv.setMaxHeight("2.1em");
        bv.setHeight("2.1em");
        bv.setMinHeight(null);
        bv.setWidth("2.3em");
	    bv.setTarget(this).setAction("onClickValueButton");
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");
        bv.setPadding("0px");
        bv.setMarginTop("1px");
        //bv.setDisplay("none");
        //bv.setIconName("Mic Off");
        bv.titleView().setIsDisplayHidden(true);
        bv.setAttribute("title", "Speech to text input")
        this.setSttButton(bv);
        this.updateSttButton();
        //this.valueViewContainer().addSubview(bv);
    }

    /*
    updateSubviews () {   
        super.updateSubviews()
        return this
    }
    */

    /*
	
    fillBottomOfColumnIfAvailable () {
        if (this.column().tiles().last() === this) {
            //this.debugLog(" update height")
            this.setMinAndMaxHeightPercentage(100)
            this.setFlexGrow(100)
            this.setBorderBottom("0em")

            this.valueView().setHeight("100%")
        } else {
            this.setFlexGrow(1)
            this.setBorderBottom("1px solid rgba(125, 125, 125, 0.5)")
        }
        return this
    }
    */

    // --- text to speech button ---
    
    syncValueFromNode () {
        super.syncValueFromNode();
        const show = this.getFromNodeDelegate("hasValueButton");
        if (show !== undefined) {
            this.sttButton().setParentViewIfTrue(this.valueViewContainer(), show);
            this.updateSttButton();
        }
    }

    isMicOn () {
        if (!this.sttSession()) {
            return false;
        }
        return this.sttSession().isRecording();
    }

    updateSttButton () {
        const iconName = this.isMicOn() ? "Mic On" : "Mic Off";
        this.sttButton().setIconName(iconName);
    }

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

    setupSttSessionIfNeeded () {
        if (!this.sttSession()) {
          const stt = SpeechToTextSession.clone().setDelegate(this).setSessionLabel("ChatInputNode STT input");
          this.setSttSession(stt);
        }
    }

    onSpeechInterimResult (sttSession) {
        const text = this.sttSession().interimTranscript();
        this.valueView().setString(text);
        console.log("onSpeechInterimResult('" + text + "')");
    }

    onSpeechFinal (sttSession) {

    }

    onSpeechInput (sttSession) {
        const text = this.sttSession().fullTranscript();
        console.log("onSpeechInput('" + text + "')");
        //debugger;
        if (text.length > 0) {
            const textField = this.valueView();
            //textField.setString(text);
            textField.setValue(text);
            textField.afterEnter(null);
            //textField.didInput();
            //this.sttSession().stop();
        }
        assert(!sttSession.isRecording());
        this.updateSttButton();
    }

    onSpeechEnd (sttSession) {
        this.updateSttButton()
    }

    onSessionEnd (sttSession) {
        this.updateSttButton()
    }
    
}.initThisClass());
