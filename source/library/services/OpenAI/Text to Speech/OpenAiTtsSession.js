"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 */

/**
 * @class OpenAiTtsSession
 * @extends SvSummaryNode
 * @classdesc OpenAiTtsSession manages Text to Speech operations.
 */
(class OpenAiTtsSession extends SvSummaryNode {

  /**
   * @description Returns an array of speed options.
   * @returns {number[]} An array of speed values.
   */
  speedOptionsJson () {
    return [1, 1.05, 1.10, 1.15, 1.2, 1.25, 1.5, 1.75, 2];
    /*
    return [
      {
        "value": 1,
        "label": "1x",
      },
      {
        "value": 1.25,
        "label": "1.25x",
      },
      {
        "value": 1.5,
        "label": "1.5x",
      },
      {
        "value": 1.75,
        "label": "1.75x",
      },
      {
        "value": 2,
        "label": "2x",
      },
    ];
    */
  }

  /**
   * @description Initializes the prototype slots for the class.
   */
  initPrototypeSlots () {

    {
      /**
       * @member {string} prompt
       * @description The prompt for text-to-speech conversion.
       */
      const slot = this.newSlot("prompt", "");
      slot.setInspectorPath("");
      //slot.setLabel("prompt");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setSummaryFormat("none");
    }

    {
      const validModels = ["tts-1", "tts-1-hd"];
      /**
       * @member {string} model
       * @description The TTS model to use.
       */
      const slot = this.newSlot("model", validModels.first());
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(validModels)
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none")
    }

    {
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
      /**
       * @member {string} voice
       * @description The voice to use for TTS.
       */
      //const slot = this.newSlot("voice", validVoices.first());
      const slot = this.newSlot("voice", "fable");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(validVoices)
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value key")
    }

    {
      const validResponseFormats = ["mp3", "opus", "aac", "flac"];
      /**
       * @member {string} responseFormat
       * @description The audio format for the TTS response.
       */
      const slot = this.newSlot("responseFormat", validResponseFormats.first());
      slot.setInspectorPath("")
      slot.setLabel("format")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(validResponseFormats)
      slot.setIsSubnodeField(true)
    }

    {
      const validValuesJson = this.speedOptionsJson()
      /**
       * @member {number} speed
       * @description The speed of the TTS playback.
       */
      const slot = this.newSlot("speed", validValuesJson.first());
      //const slot = this.newSlot("speed", validValuesJson.first().value);
      slot.setInspectorPath("")
      slot.setLabel("speed")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value key")
      slot.setValidValues(validValuesJson)
    }

    {
      /**
       * @member {null} generateAction
       * @description Action slot for generating TTS.
       */
      const slot = this.newSlot("generateAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Generate");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("generate");
    }

    {
      /**
       * @member {string} error
       * @description Stores any error messages.
       */
      const slot = this.newSlot("error", ""); // null or String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    // --- playing ---

    {
      /**
       * @member {boolean} isMuted
       * @description Indicates if the audio is muted.
       */
      const slot = this.newSlot("isMuted", false);
      slot.setInspectorPath("")
      slot.setLabel("is muted")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none");
    }

    {
      /**
       * @member {Array} ttsRequestQueue
       * @description Queue for TTS requests.
       */
      const slot = this.newSlot("ttsRequestQueue", null);
      slot.setDuplicateOp("copyValue")
      slot.setShouldStoreSlot(false);
      slot.setSummaryFormat("none");
      slot.setSlotType("Array");

    }

    {
      /**
       * @member {AudioQueue} audioQueue
       * @description Queue for audio playback.
       */
      const slot = this.newSlot("audioQueue", null);
      slot.setDuplicateOp("copyValue")
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
      slot.setSlotType("AudioQueue");
      slot.setSummaryFormat("none");
    }

    /*
    {
      const slot = this.newSlot("outputAudioBlob", null)
      slot.setShouldStoreSlot(false);
      //slot.setIsSubnode(true);
      slot.setSlotType("Blob");
    }
    */

    {
      /**
       * @member {string} status
       * @description Current status of the TTS session.
       */
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("none");
    }

    {
      /**
       * @member {WASound} sound
       * @description Latest sound being generated.
       */
      const slot = this.newSlot("sound", null); // latest sound being generated
      slot.setSlotType("WASound");
    }

    {
      /**
       * @member {Object} delegate
       * @description Delegate object for callbacks.
       */
      const slot = this.newSlot("delegate", null); 
      slot.setSlotType("Object");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(false);

    this.setNodeSubtitleIsChildrenSummary(true);
    this.setTitle("Text to Speech Session");
    this.setNoteIsSubnodeCount(true);
    this.setCanDelete(true);
  }

  /**
   * @description Initializes the OpenAiTtsSession.
   * @returns {OpenAiTtsSession} The initialized instance.
   */
  init () {
    super.init();
    this.setTtsRequestQueue([]);
    //if (!this.audioQueue()) {
      this.setAudioQueue(AudioQueue.clone());
    //}
    return this;
  }
  
  /*
  title () {
    const p = this.prompt().clipWithEllipsis(30);
    return p ? p : "Text to Speech Prompt";
  }

  subtitle () {
    return this.status()
  }
  */

  /**
   * @description Gets the parent TTS sessions.
   * @returns {Object} The parent TTS sessions.
   */
  ttsSessions () {
    return this.parentNode()
  }

  /**
   * @description Gets the OpenAI service.
   * @returns {OpenAiService} The OpenAI service instance.
   */
  service () {
    //return this.ttsSessions().service()
    return OpenAiService.shared();
  }

  // ---

  /**
   * @description Sets the muted state of the audio queue.
   * @param {boolean} aBool - The muted state to set.
   * @returns {OpenAiTtsSession} The current instance.
   */
  setIsMuted (aBool) {
    this.audioQueue().setIsMuted(aBool);
    return this;
  }

  /**
   * @description Gets the muted state of the audio queue.
   * @returns {boolean} The current muted state.
   */
  isMuted () {
    return this.audioQueue().isMuted();
  }

  // ---

  // --- generate action ---

  /**
   * @description Checks if generation is possible.
   * @returns {boolean} True if generation is possible, false otherwise.
   */
  canGenerate () {
    return this.prompt().length > 0;
  }

  /**
   * @description Gets the generate action info.
   * @returns {Object} An object containing action info.
   */
  generateActionInfo () {
    return {
        isEnabled: this.canGenerate(),
        //title: this.title(),
        isVisible: true
    }
  }

  // --- fetch ---

  /**
   * @description Gets the API endpoint for TTS.
   * @returns {string} The API endpoint URL.
   */
  endpoint () {
    return "https://api.openai.com/v1/audio/speech";
  }

  /**
   * @description Creates a new TTS request.
   * @returns {OpenAiTtsRequest} A new TTS request instance.
   */
  newRequest () {
    const request = OpenAiTtsRequest.clone();
    request.setApiUrl(this.endpoint());
    request.setDelegate(this)

    const bodyJson = {
      model: this.model(), 
      voice: this.voice(), 
      input: this.prompt(),
      response_format: this.responseFormat(), 
      speed: this.speed()
    };

    request.setBodyJson(bodyJson);
    return request;
  }

  /**
   * @description Generates TTS and queues the resulting sound.
   * @returns {WASound} The generated sound.
   */
  generate () {
    const request = this.newRequest();
    this.ttsRequestQueue().unshift(request); // needed?
    const sound = request.sound();
    sound.setTranscript(this.prompt());
    this.queueSound(sound);
    request.asyncSend();
    return sound;
  }

  /**
   * @description Queues a sound for playback.
   * @param {WASound} sound - The sound to queue.
   * @returns {OpenAiTtsSession} The current instance.
   */
  queueSound (sound) {
    this.audioQueue().queueWASound(sound);
    return this;
  }

  /**
   * @description Shuts down the TTS session.
   * @returns {OpenAiTtsSession} The current instance.
   */
  shutdown () {
    this.stopAndClearQueue();
    return this;
  }

  /**
   * @description Stops playback and clears the queue.
   */
  stopAndClearQueue () {
    this.ttsRequestQueue().forEach(r => r.shutdown());
    this.setTtsRequestQueue([]);

    this.audioQueue().stopAndClearQueue();
  }

  /**
   * @description Callback for when a request begins.
   * @param {OpenAiTtsRequest} request - The request that began.
   */
  onRequestBegin (request) {

  }

  /**
   * @description Callback for when a request completes successfully.
   * @param {OpenAiTtsRequest} request - The completed request.
   */
  async onRequestComplete (request) {
    this.setStatus("success");    
    //this.onEnd();
    //console.log('Success: got audio blob of size: ' + audioBlob.size);
  }

  /**
   * @description Callback for when a request encounters an error.
   * @param {OpenAiTtsRequest} request - The request that errored.
   * @param {Error} error - The error that occurred.
   */
  onRequestError (request, error) {
    const s = "ERROR: " + error.message;
    console.error(s);
    this.setError(error.message);
    this.setStatus(s)
    this.sendDelegate("onTtsPromptError", [this]);
    //this.onEnd();
    PanelView.showError(new Error("Text to Speech request " + s));
    debugger;
  }

  //onEnd () {
    // on success or error
  //}

  /**
   * @description Sends a message to the delegate.
   * @param {string} methodName - The name of the method to call on the delegate.
   * @param {Array} args - The arguments to pass to the delegate method.
   * @returns {boolean} True if the delegate method was called, false otherwise.
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

  // --- playing audio ---- 

  /*
  queueAudioBlob (audioBlob) { // called by the request once it's complete
    this.audioQueue().queueAudioBlob(audioBlob);
    return this;
  }
  */
  
  /**
   * @description Pauses audio playback.
   */
  pause() {
    this.debugLog("pause()");
    this.audioQueue().pause();
  }

  /**
   * @description Resumes audio playback.
   */
  resume () {
    this.debugLog("resume()");
    this.audioQueue().resume();
  }

}.initThisClass());

  