"use strict";

/* 
    OpenAiTtsSession
 
*/

(class OpenAiTtsSession extends BMSummaryNode {

  speedOptionsJson () {
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
      slot.setSummaryFormat("value key")
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
      const slot = this.newSlot("speed", validValuesJson.first().value);
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
  }

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setCanAdd(false);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(false);
    //if (!this.audioQueue()) {
      this.setAudioQueue(AudioQueue.clone());
    //}
    this.setNodeSubtitleIsChildrenSummary(true);
    this.setTitle("Text to Speech Session");
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

  finalInit() {
    super.finalInit()
    this.setCanDelete(true)
  }

  ttsSessions () {
    return this.parentNode()
  }

  service () {
    //return this.ttsSessions().service()
    return HavewordsApp.shared().services().openAiService()
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

  apiKey () {
    return this.service().apiKey()
  }

  newRequest () {
    const request = OpenAiRequest.clone();
    request.setApiUrl(this.endpoint());
    request.setApiKey(this.apiKey());
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

  onRequestBegin(request) {

  }

  onRequestComplete(request) {
    this.onSuccess();
  }

  onRequestError(request, error) {

  }

  async generate () {
    const request = this.newRequest();
    const sound = WASound.clone();
    request._sound = sound;
    await request.asyncSend();
    return sound;
  }

  /*
  generate () {
    this.setError("");
    this.setStatus("fetching response...");
    this.sendDelegate("onTtsPromptStart", [this]);

    const sound = WASound.clone();

    const apiKey = this.service().apiKey(); // Replace with your actual API key
    
    const bodyJson = {
        model: this.model(), 
        voice: this.voice(), 
        input: this.prompt(),
        response_format: this.responseFormat(), 
        speed: this.speed()
    };
    
    fetch(this.endpoint(), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ` + apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyJson)
    })
    .then(response => {
      response._sound = sound;
        this.onSuccess(response);
    })
    .catch((error) => {
        this.onError(error);
    });
    return sound;
  }
  */

  async onSuccess (response) {
    const audioBlob = await response.blob();
    // need to call asyncPrepareToStoreSynchronously as OutputAudioBlob slot is stored,
    // and all writes to the store tx need to be sync so the store is in a consistent state for it's
    // next read/write
    //await audioBlob.asyncPrepareToStoreSynchronously() 
    //const sound = WASound.fromBlob(audioBlob);

    const sound = response._sound;
    sound.setDataBlob(audioBlob);
    this.audioQueue().queueWASound(sound);
    this.setStatus("success");
    //console.log('Success: got audio blob of size: ' + audioBlob.size);
  }

  onError (error) {
    const s = "ERROR: " + error.message;
    console.error(s);
    this.setError(error.message);
    this.setStatus(s)
    this.sendDelegate("onTtsPromptError", [this]);
    this.onEnd();
  }

  onEnd () {
    this.sendDelegate("onTtsPromptEnd", [this])
  }

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
