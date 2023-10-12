"use strict";

/* 
    AzureSpeaker

  Rate: Controls the speed of the speech. Allowed values are x-slow, slow, medium, fast, x-fast, or a percentage. 
  A value of 0% (default) means normal speed, values above 0% increase the speed, and values below 0% decrease it.

  Pitch: Controls the pitch (frequency) of the speech. Allowed values are x-low, low, medium, high, x-high, or a relative change in semitones or Hertz. 
  The default value is "medium". A positive relative change raises the pitch, while a negative one lowers it.

  Volume: Controls the volume of the speech. Allowed values are silent, x-soft, soft, medium, loud, x-loud, or a decibel value. 
  The default value is "medium". Decibel values are relative to the volume of the normal speech. 
  Positive values make the speech louder, while negative values make it quieter.


    "en-US-AriaNeural", 
    "en-US-DavisNeural", 
    "en-US-GuyNeural", 
    "en-US-JaneNeural",
    "en-US-JasonNeural",
    "en-US-JennyNeural",
    "en-US-NancyNeural",
    "en-US-SaraNeural",
    "en-US-TonyNeural"

    fetch voice options:

    curl --location --request GET 'https://YOUR_RESOURCE_REGION.tts.speech.microsoft.com/cognitiveservices/voices/list' \
--header 'Ocp-Apim-Subscription-Key: YOUR_RESOURCE_KEY'

*/

(class AzureSpeaker extends BMSummaryNode {
  initPrototypeSlots () {
    /*
    {
      const slot = this.newSlot("service", null);
    }
    */

    {
      const slot = this.newSlot("localeName", "English (United States)");
      slot.setInitValue("English (United States)")
      slot.setInspectorPath("")
      slot.setLabel("language / locale name")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValuesClosure((instance) => { 
        return instance.validLocaleNames()
      })   
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("displayName", null);
      slot.setInspectorPath("")
      slot.setLabel("display name")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)      
      slot.setSummaryFormat("value")
      slot.setValidValuesClosure((instance) => { 
        return instance.validDisplayNames()
      })  
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("voiceStyle", null);
      slot.setInspectorPath("")
      slot.setLabel("style")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValuesClosure((instance) => { 
        return instance.validVoiceStyles()
      })  
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value")
    }
    
    {
      const slot = this.newSlot("volume", "soft");
      slot.setInspectorPath("")
      slot.setLabel("volume")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValuesClosure((instance) => { 
        return instance.validVolumes()
      })  
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value")
    }
    
    {
      const slot = this.newSlot("rate", 10);
      slot.setInspectorPath("")
      slot.setLabel("% rate adjustment")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value key")
    }

    {
      const slot = this.newSlot("pitch", -10);
      slot.setInspectorPath("")
      slot.setLabel("% pitch adjustment")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value key")
    }

    {
      const slot = this.newSlot("isMuted", false);
      slot.setInspectorPath("")
      slot.setLabel("Muted")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("currentAudio", null);
      /*
      slot.setInspectorPath("")
      slot.setLabel("Muted")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("AudioBlob")
      slot.setIsSubnodeField(true)
      */
    }

    {
      const slot = this.newSlot("audioBlobQueue", null);
    }

    {
      const slot = this.newSlot("requests", null)
      slot.setLabel("requests")
      slot.setFinalInitProto(AzureTtsRequests)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    /*
    {
      const slot = this.newSlot("startAction", "startAction");
      slot.setInspectorPath("")
      //slot.setLabel("image")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      //slot.setIsSubnodeField(true)
      slot.setSlotType("c")
      slot.setCanEditInspection(false)
    }
    */

    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
  }

  /*
  initPrototype () {
    const slot = this.slotNamed("shortName")
    slot.setValidValues(this.validShortNames())
  }
  */

  init () {
    super.init();
    this.setTitle("Azure Speaker");
    this.setAudioBlobQueue([]);

  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);

  }

  // --- updates ---

  /*

  didUpdateSlotLocaleName (oldValue, newValue) {
    // sync shortName and voiceStyle
    //debugger;
  }

  didUpdateField (aField) {
    // tell other fields to update
    debugger
  }
  */

  // --- helpers ---

  speakers () {
    return this.parentNode() // why doesn't this work?
  }

  service () {
    return this.speakers().service()
  }

  voices () {
    return this.service().voices()
  }

  // --- selection ---

  validLocaleNames () {
    return this.voices().localeNames()
  }

  validDisplayNames () {
    const localeMatches = this.voices().voicesForMethodNameAndValue("localeName", this.localeName())
    const displayNames = localeMatches.map(voice => voice.displayName())
    return displayNames
  }

  selectedVoice () {
    // localeName + displayName should be enough to select a unique voice
    const localeMatches = this.voices().voicesForMethodNameAndValue("localeName", this.localeName())
    const displayNameMatches = localeMatches.select(voice => voice.displayName())
    const match = displayNameMatches.first()
    return match
  }

  shortName () {
    const v = this.selectedVoice()
    return v ? v.shortName() : null;
  }

  // ---------------------

  validVolumes () {
    return [
      "silent",
      "x-soft",
      "soft",
      "medium",
      "loud",
      "x-loud",
      "default"
    ]
  }

  // ---------------------

  validVoiceStyles () {
   // debugger;
    const styles = this.selectedVoice().styleList()
    return styles !== null ? styles : []
  }
  
  // ---

  setIsMuted (aBool) {
    this._isMuted = aBool;
    if (aBool) {
      this.pause();
    } else {
      this.resume();
    }
    return this;
  }

  locale () {
    const voice = this.selectedVoice()
    return voice ? voice.locale() : null;
  }

  async asyncSpeakTextIfAble (text) {
    if (this.hasApiAccess()) {
      await this.asyncSpeakText(text);
    }
  }

  pitchString () {
    return this.pitch() + "%"
  }

  rateString () {
    return this.pitch() + "%"
  }

  // -------------------------------------

  ssmlRequestForText (text) {
    let s = `<prosody volume='soft' rate='${this.rateString()}' pitch='${this.pitchString()}'>${text}</prosody>`;

    // wrap in style choice if available
    const style = this.voiceStyle();
    if (style) {
      // wrap it in a style, if one is specified and supported
      s = `<mstts:express-as style='${style}'>${s}</mstts:express-as>`
    }
    
    const ssmlRequest = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${this.locale()}'>
        <voice name='${this.shortName()}'>
          ${s}
        </voice>
      </speak>`;
    return ssmlRequest;
  }

  // -----------------------------------

  queueAudioBlob (audioBlob) {
    this.audioBlobQueue().push(audioBlob);
    this.processQueue();
    return this;
  }

  processQueue () {
    if (!this.currentAudio()) {
      const q = this.audioBlobQueue();
      if (q.length) {
        const blob = q.shift();
        this.playAudioBlob(blob);
      }
    }
    return this;
  }

  playAudioBlob (audioBlob) {
    this.pause();
    if (!this.isMuted()) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      this.setCurrentAudio(audio);
      audio.onended = () => { this.onAudioEnd(audio); }

      //HostSession.shared().broadcastPlayAudioBlob(audioBlob);
    } else {
      this.processQueue();
    }
    return this;
  }

  onAudioEnd (audio) {
    this.debugLog("finished playing");
    this.setCurrentAudio(null);
    this.processQueue();
  }
  
  pause() {
    this.debugLog("pause()");

    const audio = this.currentAudio();
    if (audio) {
      audio.pause();
      this.debugLog("paused");
    }
  }

  resume () {
    this.debugLog("resume()");

    const audio = this.currentAudio();
    if (audio) {
      //if (audio.paused) {
        audio.play();
        this.debugLog("resumed");
      //}
    }
  }

}.initThisClass());

