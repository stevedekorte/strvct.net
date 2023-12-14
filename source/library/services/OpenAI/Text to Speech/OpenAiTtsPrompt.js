"use strict";

/* 
    OpenAiTtsPrompt
 
*/

(class OpenAiTtsPrompt extends BMSummaryNode {
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
      const slot = this.newSlot("speed", 1.0);
      slot.setInspectorPath("")
      slot.setLabel("speed")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value key")
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
      const slot = this.newSlot("audioQueue", null)
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
    this.setAudioQueue(AudioQueue.clone());
    this.setNodeSubtitleIsChildrenSummary(true);
    this.setTitle("Text to Speech");
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

  ttsPrompts () {
    return this.parentNode()
  }

  service () {
    //return this.ttsPrompts().service()
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

  generate () {
    this.start();
    return this;
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

  start () {
    this.setError("");
    this.setStatus("fetching response...");
    this.sendDelegate("onTtsPromptStart", [this]);

    this.setSound(WASound.clone());

    const apiKey = this.service().apiKey(); // Replace with your actual API key
    const endpoint = 'https://api.openai.com/v1/images/generations'; // DALL·E 2 API endpoint
    
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
        this.onSuccess(response);
    })
    .catch((error) => {
        this.onError(error);
    });
  }

  async onSuccess (response) {
    const audioBlob = await response.blob();
    // need to call asyncPrepareToStoreSynchronously as OutputAudioBlob slot is stored,
    // and all writes to the store tx need to be sync so the store is in a consistent state for it's
    // next read/write
    //await audioBlob.asyncPrepareToStoreSynchronously() 
    //const sound = WASound.fromBlob(audioBlob);
    
    const sound = this.sound();
    sound.setDataBlob(audioBlob);
    this.audioQueue().queueWASound(sound);
    this.setStatus("success");
    console.log('Success: got audio blob of size: ' + audioBlob.size);
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
