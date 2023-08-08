"use strict";

/* 

    SpeechToTextSession

*/

(class SpeechToTextSession extends BMSummaryNode {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("recognition", null);
    }

    {
      const slot = this.newSlot("delegate", null);
    }

    {
      const slot = this.newSlot("sessionLabel", "");      
      slot.setInspectorPath("")
      slot.setLabel("label")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("inputTimeoutId", null);
    }

    {
      const slot = this.newSlot("inputTimeoutMs", 3000);      
      slot.setInspectorPath("")
      slot.setLabel("inputTimeoutMs")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }


    {
      /* 
      If continuous is set to true, the recognition service continues listening and returning results, 
      even if the user takes a pause. This allows for continuous recognition, 
      where the user can speak, pause, and then continue speaking without the recognition service stopping.
      */

      const slot = this.newSlot("isContinuous", true);      
      slot.setInspectorPath("settings")
      slot.setLabel("Don't break on Pauses")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    {
      /*
      If interimResults is set to true, the system will return both interim (temporary or provisional) results and final results. 
      Interim results are essentially guesses or partial results that might change as more audio is processed. 
      They allow you to show what the system is recognizing in real-time as the user is speaking.
      */
      const slot = this.newSlot("getInterimResults", true);      
      slot.setInspectorPath("settings")
      slot.setLabel("Shares Interim Results")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }


    {
      const slot = this.newSlot("interimTranscript", "");      
      slot.setInspectorPath("")
      slot.setLabel("interim transcript")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("finalTranscript", "");      
      slot.setInspectorPath("")
      slot.setLabel("final transcript")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }


    {
      const slot = this.newSlot("fullTranscript", "");      
      slot.setInspectorPath("")
      slot.setLabel("full transcript")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("isRecording", false);
      slot.setInspectorPath("")
      slot.setLabel("is recording")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      slot.setSummaryFormat("value")
    }
    
    {
      const slot = this.newSlot("toggleRecordingAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Start")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("toggleRecording");
    }

  }

  init() {
    super.init();
    this.setSubtitle("STT Session");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setIsDebugging(true)
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(false);
    this.setCanDelete(true);
    this.setIsRecording(false);
  }

  title () {
    const label = this.sessionLabel()
    if (label) {
      return label
    }

    if (this.fullTranscript()) {
      let s = this.fullTranscript().substr(0, 100)
      if (s.length < 20) {
        s += "..."
      }
      return s
    }

    return "Unlabeled"
  }

  onUpdateSlotIsContinuos (aSlot, oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().continuous = newValue;
    }
  }

  onUpdateSlotGetInterimResults (aSlot, oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().interimResults = newValue;
    }
  }

  onUpdateSlotIsRecording (aSlot, oldValue, newValue) {
    if (this.recognition()) {
      this.didUpdateNode()
    }
  }

  setupIfNeeded () {
    if (!this.recognition()) {
      const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

      const rec = new SpeechRecognition();
      //console.log("setup SpeechRecognition")
      assert(rec)

      rec.continuous = this.isContinuous();
      rec.interimResults = this.getInterimResults();
      rec.lang = 'en-US';
      
      rec.onresult = (event) => {
          this.onResult(event)
      };

      rec.onspeechend = (event) => {
         // fired when speech recognition detects that the user has stopped speaking.
         this.onSpeechEnd(event)
      };

      rec.onend = (event) => {
        // fired when the recognition service has disconnected and the session has ended, 
        // whether it's due to completion, an error, or a call to the stop() method.
        this.onEnd(event)
      };

      rec.onerror = (event) => {
        this.onError(event);
      };

      this.setRecognition(rec)
    }

    return this
  }

  usesInputTimeout () {
    return this.getInterimResults()
  }

  startInputTimeout () {
    this.clearInputTimeout()
    if (this.usesInputTimeout()) {
      const tid = setTimeout(() => this.onInputTimeout(), this.inputTimeoutMs());
      this.setInputTimeoutId(tid)
    }
    return this
  }

  clearInputTimeout () {
    const tid = this.inputTimeoutId()
    if (tid) {
      clearTimeout(tid)
      this.setInputTimeoutId(null)
    }
    return this
  }

  resetInputTimeout () {
    this.clearInputTimeout()
    this.startInputTimeout()
    return this
  }

  onInputTimeout () {
    this.clearInputTimeout()
    console.log("SPEECH onInputTimeout() stop")
    this.stop()
    return this
  }

  onResult (event) {
    //this.debugLog("onResult")

    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
    }

    console.log("SPEECH onResult interm: '" + interim + "'")
    console.log("SPEECH onResult final: '" + final + "'")

    if (interim.length) {
      this.resetInputTimeout()
    }

    this.setInterimTranscript(interim)
    if (final) {
      this.setFinalTranscript(final)
      this.appendToFullTranscript(this.finalTranscript())
      console.log("SPEECH onResult full: '" + this.fullTranscript() + "'")

      if (!this.isRecording()) {
        this.setFinalTranscript("")
      }
    }

    this.sendDelegateMessage("onSpeechInterimResult", [this])
  }

  intermFullTranscript () {
    return this.fullTranscript() + this.interimTranscript()
  }

  appendToFullTranscript (s) {
    const ft = this.fullTranscript()
    const spacer = ft.length === 0 ? "" : "..."
    this.setFullTranscript(ft + spacer + this.finalTranscript())
    return this
  }

  clearTranscript () {
    this.setInterimTranscript("")
    this.setFinalTranscript("")
    this.setFullTranscript("")
    return this
  }

  onSpeechEnd (event) {
  }

  onEnd (event) {
    this.setIsRecording(false)
    this.sendDelegateMessage("onSpeechEnd", [this])
  }

  onError (event) {
    this.sendDelegateMessage("onSpeechError", [this, event.error])
    console.warn(this.typeId() + " error: " + event.error)
  }

  start () {
    this.debugLog("start")
    if (!this.isRecording()) {
      this.clearTranscript();
      this.setupIfNeeded();
      this.startInputTimeout()
      this.recognition().start();
      this.setIsRecording(true);
    }
    return this
  }

  startActionInfo () {
    return {
      isEnabled: !this.isRecording()
    }
  }

  stop () {
    //this.debugLog("stop")
    if (this.isRecording()) {
      this.clearInputTimeout()
      this.recognition().stop();
      this.setIsRecording(false);
      //this.appendToFullTranscript(this.interimTranscript())
      //this.setInterimTranscript("")
      //this.setFinalTranscript("")
    }
    return this
  }

  stopActionInfo () {
    return {
      isEnabled: this.isRecording()
    }
  }

  toggleRecording () {
    if (this.isRecording()) {
      this.stop() 
    } else {
      this.start()
    }
  }

  toggleRecordingActionInfo () {
    return {
      isEnabled: true,
      title: this.isRecording() ? "stop" : "start"
    }
  }

  // --- delegate ---

  sendDelegateMessage (methodName, args = []) {
    const d = this.delegate();
    if (d) {
      const m = d[methodName];
      if (m) {
        m.apply(d, args);
      }
    }
  }



}.initThisClass());
