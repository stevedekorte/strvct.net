"use strict";

/* 
    OpenAiTtsSession
 
    Text to Speech

*/

(class OpenAiTtsSession extends BMSummaryNode {

  speedOptionsJson () {
    return [1, 1.25, 1.5, 1.75, 2];
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

  initPrototypeSlots() {

    {
      const slot = this.newSlot("prompt", "");
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("");
    }

    {
      const validModels = ["tts-1", "tts-1-hd"];
      const slot = this.newSlot("model", validModels.first());
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(validModels)
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("")
    }

    {
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
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
      const slot = this.newSlot("isMuted", false);
      slot.setInspectorPath("")
      slot.setLabel("is muted")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("");
    }

    {
      const slot = this.newSlot("ttsRequestQueue", null);
      slot.setDuplicateOp("copyValue")
      slot.setShouldStoreSlot(false);
      slot.setSummaryFormat("");
    }

    {
      const slot = this.newSlot("audioQueue", null);
      slot.setDuplicateOp("copyValue")
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
      slot.setSummaryFormat("");
    }

    /*
    {
      const slot = this.newSlot("outputAudioBlob", null)
      slot.setShouldStoreSlot(false);
      //slot.setIsSubnode(true);
    }
    */

    {
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("");
    }

    {
      const slot = this.newSlot("sound", null); // latest sound being generated
    }

    {
      const slot = this.newSlot("delegate", null); 
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

  ttsSessions () {
    return this.parentNode()
  }

  service () {
    //return this.ttsSessions().service()
    return OpenAiService.shared();
  }

  // ---

  setIsMuted (aBool) {
    this.audioQueue().setIsMuted(aBool);
    return this;
  }

  isMuted () {
    return this.audioQueue().isMuted();
  }

  // ---

  // --- generate action ---

  canGenerate () {
    return this.prompt().length > 0;
  }

  generateActionInfo () {
    return {
        isEnabled: this.canGenerate(),
        //title: this.title(),
        isVisible: true
    }
  }

  // --- fetch ---

  endpoint () {
    return "https://api.openai.com/v1/audio/speech";
  }

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

  generate () {
    const request = this.newRequest();
    this.ttsRequestQueue().unshift(request); // needed?
    const sound = request.sound();
    sound.setTranscript(this.prompt());
    this.queueSound(sound);
    request.asyncSend();
    return sound;
  }

  queueSound (sound) {
    this.audioQueue().queueWASound(sound);
    return this;
  }

  shutdown () {
    this.stopAndClearQueue();
    return this;
  }

  stopAndClearQueue () {
    this.ttsRequestQueue().forEach(r => r.shutdown());
    this.setTtsRequestQueue([]);

    this.audioQueue().stopAndClearQueue();
  }

  onRequestBegin (request) {

  }

  async onRequestComplete (request) {
    this.setStatus("success");    
    //this.onEnd();
    //console.log('Success: got audio blob of size: ' + audioBlob.size);
  }

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
  
  pause() {
    this.debugLog("pause()");
    this.audioQueue().pause();
  }

  resume () {
    this.debugLog("resume()");
    this.audioQueue().resume();
  }

}.initThisClass());
