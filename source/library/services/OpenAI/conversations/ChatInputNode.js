"use strict";

/* 
    ChatInputNode

*/

(class ChatInputNode extends BMTextAreaField {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("conversation", null); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      //slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("hasValueButton", false);
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("isMicOn", false);
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("sttSession", null);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setKeyIsVisible(false)
    this.setValue("")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatInputTile")
    this.setKeyIsVisible(false)
  }

  onValueInput () {
    if (this.value()) {
      this.send()
    }
  }

  send () {
    //this.conversation().onChatInput(this)
    this.conversation().onChatInputValue(this.value())
  }

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

  setupSttSessionIfNeeded () {
    if (!this.sttSession()) {
      const stt = SpeechToTextSession.clone().setDelegate(this);
      this.setSttSession(stt);
    }
  }

  /*
  sehatValue (v) {
    debugger;
    return super.setValue(v)
  }
  */

  onSpeechInterimResult (sttSession) {
    const text = this.sttSession().interimTranscript();
    this.setValue(text);
    console.log("onSpeechInterimResult('" + text + "')");
  }

  onSpeechEnd (sttSession) {
    const text = this.sttSession().interimTranscript();
    this.setValue(text);
    this.onValueInput();
    this.setValue("");
    console.log("onSpeechEnd('" + text + "')");
    /*
    debugger;
    this.sttSession().stop();
  */
    this.setIsMicOn(false);
  }

}.initThisClass());
