"use strict";

/**
 * @module library.services.SpeechToText
 */

/**
 * @class SpeechToTextSession
 * @extends SvSummaryNode
 * @classdesc A class representing a speech-to-text session.
 */
(class SpeechToTextSession extends SvSummaryNode {
  /**
   * @description Initializes the prototype slots for the SpeechToTextSession class.
   */
  initPrototypeSlots () {
    /**
     * @member {SpeechRecognition} recognition - The speech recognition object.
     */
    {
      const slot = this.newSlot("recognition", null);
      slot.setSlotType("SpeechRecognition");
    }

    /**
     * @member {Object} delegate - The delegate object.
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {string} sessionLabel - The label for the session.
     */
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

    /**
     * @member {string} language - The language for speech recognition.
     */
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

    /**
     * @member {number} inputTimeoutId - The ID of the input timeout.
     */
    {
      const slot = this.newSlot("inputTimeoutId", null);
      slot.setSlotType("Number");
    }

    /**
     * @member {number} inputTimeoutMs - The input timeout in milliseconds.
     */
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

    /**
     * @member {boolean} isContinuous - Whether the recognition service continues listening and returning results, even if the user takes a pause.
     */
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

    /**
     * @member {boolean} getInterimResults - Whether to return both interim and final results.
     */
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

    /**
     * @member {string} interimTranscript - The interim transcript.
     */
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

    /**
     * @member {string} finalTranscript - The final transcript.
     */
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

    /**
     * @member {string} fullTranscript - The full transcript.
     */
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

    /**
     * @member {boolean} isRecording - Whether the session is currently recording.
     */
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
    
    /**
     * @member {Action} toggleRecordingAction - The action to toggle recording.
     */
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

    /**
     * @member {Promise} transcriptPromise - The promise for the transcript.
     */
    {
      const slot = this.newSlot("transcriptPromise", null);
      slot.setSlotType("Promise");
    }

  }

  /**
   * @description Initializes the SpeechToTextSession.
   */
  init () {
    super.init();
    this.setSubtitle("STT Session");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setIsDebugging(true);
  }

  /**
   * @description Performs final initialization of the SpeechToTextSession.
   */
  finalInit () {
    super.finalInit()
    this.setNoteIsSubnodeCount(false);
    this.setCanDelete(true);
    this.setIsRecording(false);
  }

  /**
   * @description Gets the title of the session.
   * @returns {string} The title of the session.
   */
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

  /**
   * @description Updates the continuous property of the recognition object when isContinuous is updated.
   * @param {boolean} oldValue - The old value of isContinuous.
   * @param {boolean} newValue - The new value of isContinuous.
   */
  didUpdateSlotIsContinuos (oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().continuous = newValue;
    }
  }

  /**
   * @description Updates the interimResults property of the recognition object when getInterimResults is updated.
   * @param {boolean} oldValue - The old value of getInterimResults.
   * @param {boolean} newValue - The new value of getInterimResults.
   */
  didUpdateSlotGetInterimResults (oldValue, newValue) {
    if (this.recognition()) {
      this.recognition().interimResults = newValue;
    }
  }

  /**
   * @description Updates the node when isRecording is updated.
   * @param {boolean} oldValue - The old value of isRecording.
   * @param {boolean} newValue - The new value of isRecording.
   */
  didUpdateSlotIsRecording (/*oldValue, newValue*/) {
    if (this.recognition()) {
      this.didUpdateNode()
    }
  }

  /**
   * @description Sets up the recognition object if it hasn't been set up yet.
   * @returns {SpeechToTextSession} The current instance.
   */
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

  /**
   * @description Checks if input timeout is used.
   * @returns {boolean} Whether input timeout is used.
   */
  usesInputTimeout () {
    return this.getInterimResults()
  }

  /**
   * @description Starts the input timeout.
   * @returns {SpeechToTextSession} The current instance.
   */
  startInputTimeout () {
    this.clearInputTimeout()
    if (this.usesInputTimeout()) {
      const tid = this.addTimeout(() => this.onInputTimeout(), this.inputTimeoutMs());
      this.setInputTimeoutId(tid)
    }
    return this
  }

  /**
   * @description Clears the input timeout.
   * @returns {SpeechToTextSession} The current instance.
   */
  clearInputTimeout () {
    const tid = this.inputTimeoutId()
    if (tid) {
      clearTimeout(tid)
      this.setInputTimeoutId(null)
    }
    return this
  }

  /**
   * @description Resets the input timeout.
   * @returns {SpeechToTextSession} The current instance.
   */
  resetInputTimeout () {
    this.clearInputTimeout()
    this.startInputTimeout()
    return this
  }

  /**
   * @description Handles the input timeout event.
   * @returns {SpeechToTextSession} The current instance.
   */
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

  /**
   * @description Handles the result event from the speech recognition.
   * @param {Event} event - The result event.
   */
  onResult (event) {
    //this.logDebug("onResult")

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

  /**
   * @description Gets the interim full transcript.
   * @returns {string} The interim full transcript.
   */
  intermFullTranscript () {
    return this.fullTranscript() + this.interimTranscript()
  }

  /**
   * @description Appends to the full transcript.
   * @param {string} s - The string to append.
   * @returns {SpeechToTextSession} The current instance.
   */

  appendToFullTranscript (s) {
    const ft = this.fullTranscript()
    const spacer = ft.length === 0 ? "" : " "
    this.setFullTranscript(ft + spacer + s)
    return this
  }

  /**
   * @description Clears the transcript.
   * @returns {SpeechToTextSession} The current instance.
   */
  clearTranscript () {
    this.setInterimTranscript("")
    this.setFinalTranscript("")
    this.setFullTranscript("")
    return this
  }

  /**
   * @description Handles the speech end event.
   * @param {Event} event - The speech end event.
   */
  onSpeechEnd (/*event*/) {
    this.sendDelegateMessage("onSpeechEnd", [this]);
  }

  /**
   * @description Handles the input event.
   */
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

  /**
   * @description Handles the end event.
   * @param {Event} event - The end event.
   */
  onEnd (/*event*/) {
    this.setIsRecording(false)
    this.sendDelegateMessage("onSessionEnd", [this])
  }

  /**
   * @description Handles the error event.
   * @param {Event} event - The error event.
   */
  onError (event) {
    const error = event.error;
    this.sendDelegateMessage("onSpeechError", [this, error]);
    console.warn(this.svTypeId() + " error: " + error);
    if (this.transcriptPromise()) {
      this.transcriptPromise().callRejectFunc(error);
    }
  }

  /**
   * @description Starts the speech recognition.
   * @returns {Promise} The transcript promise.
   */
  start () {
    this.logDebug("start")
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

  /**
   * @description Gets the start action info.
   * @returns {Object} The start action info.
   */
  startActionInfo () {
    return {
      isEnabled: !this.isRecording()
    }
  }

  /**
   * @description Stops the speech recognition.
   * @returns {SpeechToTextSession} The current instance.
   */
  stop () {
    //this.logDebug("stop")
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

  /**
   * @description Gets the stop action info.
   * @returns {Object} The stop action info.
   */
  stopActionInfo () {
    return {
      isEnabled: this.isRecording()
    }
  }

  /**
   * @description Toggles the recording state.
   */
  toggleRecording () {
    if (this.isRecording()) {
      this.stop() 
    } else {
      this.start()
    }
  }

  /**
   * @description Gets the toggle recording action info.
   * @returns {Object} The toggle recording action info.
   */
  toggleRecordingActionInfo () {
    return {
      isEnabled: true,
      title: this.isRecording() ? "stop" : "start"
    }
  }

  // --- delegate ---

  /**
   * @description Sends a delegate message.
   * @param {string} methodName - The method name to call.
   * @param {Array} args - The arguments to pass to the method.
   */
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
