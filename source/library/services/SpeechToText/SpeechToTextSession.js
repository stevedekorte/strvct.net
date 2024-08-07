"use strict";

/* 

    SpeechToTextSession

*/

(class SpeechToTextSession extends BMSummaryNode {
  initPrototypeSlots () {
    {
      const slot = this.newSlot("recognition", null);
      slot.setSlotType("SpeechRecognition");
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
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
      const slot = this.newSlot("language", 'en-US');
      slot.setCanEditInspection(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath("settings")
      slot.setLabel("language");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("String")
      slot.setIsSubnodeField(true);
      slot.setValidValues(['en-US']);
      slot.setSummaryFormat("key value");
    }


    {
      const slot = this.newSlot("inputTimeoutId", null);
      slot.setSlotType("Number");
    }

    {
      const slot = this.newSlot("inputTimeoutMs", 1500);      
      slot.setInspectorPath("settings");
      slot.setLabel("inputTimeoutMs");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSummaryFormat("key value");
    }


    {
      /* 
      If continuous is set to true, the recognition service continues listening and returning results, 
      even if the user takes a pause. This allows for continuous recognition, 
      where the user can speak, pause, and then continue speaking without the recognition service stopping.
      */

      const slot = this.newSlot("isContinuous", true);      
      slot.setInspectorPath("settings");
      slot.setLabel("Don't break on Pauses");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSummaryFormat("key value");
    }

    {
      /*
      If interimResults is set to true, the system will return both interim (temporary or provisional) results and final results. 
      Interim results are essentially guesses or partial results that might change as more audio is processed. 
      They allow you to show what the system is recognizing in real-time as the user is speaking.
      */
      const slot = this.newSlot("getInterimResults", true);      
      slot.setInspectorPath("settings");
      slot.setLabel("Shares Interim Results");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSummaryFormat("key value");
    }


    {
      const slot = this.newSlot("interimTranscript", "");      
      slot.setInspectorPath("");
      slot.setLabel("interim transcript");
      slot.setShouldStoreSlot(true);
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

    {
      const slot = this.newSlot("transcriptPromise", null);
      slot.setSlotType("Promise");
    }

  }

  init() {
    super.init();
    this.setSubtitle("STT Session");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setIsDebugging(true);
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

  didUpdateSlotIsContinuos (oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().continuous = newValue;
    }
  }

  didUpdateSlotGetInterimResults (oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().interimResults = newValue;
    }
  }

  didUpdateSlotIsRecording (oldValue, newValue) {
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
      //console.log("rec.continuous:", rec.continuous);
      rec.interimResults = this.getInterimResults();
      rec.lang = this.language();
      
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

  // --- timeout ---

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
    this.clearInputTimeout();
    console.log("SPEECH onInputTimeout() stop");
    this.onInput();
    this.stop();
    /*
    if (this.isContinuous()) {
      this.start();
    }
    */
    return this
  }

  // --- events ---

  onResult (event) {
    //this.debugLog("onResult")

    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        const word = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += word;
        } else {
          interim += word;
        }
    }

    console.log("SPEECH onResult interm: '" + interim + "'")

    if (interim.length) {
      this.resetInputTimeout()
    }

    this.setInterimTranscript(interim);
    if (interim.length) {
      this.sendDelegateMessage("onSpeechInterimResult", [this])
    }

    if (final) {
      this.setFinalTranscript(final)
      this.appendToFullTranscript(this.finalTranscript())
      //console.log("SPEECH onResult full: '" + this.fullTranscript() + "'")

      console.log("SPEECH onResult final: '" + final + "'")
      this.sendDelegateMessage("onSpeechFinal", [this])
      
      if (!this.isRecording()) {
        this.setFinalTranscript("")
      }
    }
  }

  intermFullTranscript () {
    return this.fullTranscript() + this.interimTranscript()
  }

  appendToFullTranscript (s) {
    const ft = this.fullTranscript()
    const spacer = ft.length === 0 ? "" : " "
    this.setFullTranscript(ft + spacer + s)
    return this
  }

  clearTranscript () {
    this.setInterimTranscript("")
    this.setFinalTranscript("")
    this.setFullTranscript("")
    return this
  }

  onSpeechEnd (event) {
    this.sendDelegateMessage("onSpeechEnd", [this]);
  }

  onInput () {
    // copy any interm to full Transcript
    // any transcript marked final was (presumably) already added to full transcript in onResult()
    this.appendToFullTranscript(this.interimTranscript());
    this.setInterimTranscript("");
    this.setFinalTranscript("");
    this.stop(); // copying the interim transcript is only valid if we stop the recording, which clears the results.
    this.sendDelegateMessage("onSpeechInput", [this]);
    this.transcriptPromise().callResolveFunc(this.fullTranscript());
  }

  onEnd (event) {
    this.setIsRecording(false)
    this.sendDelegateMessage("onSessionEnd", [this])
  }

  onError (event) {
    const error = event.error;
    this.sendDelegateMessage("onSpeechError", [this, error]);
    console.warn(this.typeId() + " error: " + error);
    if (this.transcriptPromise()) {
      this.transcriptPromise().callRejectFunc(error);
    }
  }

  start () {
    this.debugLog("start")
    if (!this.isRecording()) {
      this.setTranscriptPromise(Promise.clone());
      this.clearTranscript();
      this.setupIfNeeded();
      this.startInputTimeout()
      this.recognition().start();
      this.setIsRecording(true);
    }
    return this.transcriptPromise();
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
