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
    {
      const slot = this.newSlot("language", "en-US");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.languageOptionLabels())
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("voiceName", "en-US-TonyNeural");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validVoiceNames())
      slot.setIsSubnodeField(true)      
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("voiceStyle", "whispering");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validVoiceStyles())
      slot.setIsSubnodeField(true)
      slot.setSummaryFormat("value")
    }

    /*
    {
      const slot = this.newSlot("voicesJson", AzureVoicesData.json());
    }
    */
    
    {
      const slot = this.newSlot("volume", "soft");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validVolumes())
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
      //slot.setValidValues(this.validVolumes())
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
      //slot.setValidValues(this.validVolumes())
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
      slot.setSlotType("Action")
      slot.setCanEditInspection(false)
    }
    */

    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init();
    this.setTitle("Azure Speaker");
    this.setAudioBlobQueue([]);
  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  speakers () {
    return this.parentNode()
  }

  // ---

  voicesJson () {
    return AzureVoicesData.json()
  }

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

  validVoiceNames () {
    return [
      "en-US-TonyNeural"
    ]
  }

  validVoiceStyles () {
    return [
      "newscast",
      "angry",
      "cheerful",
      "sad",
      "excited",
      "friendly",
      "terrified",
      "shouting",
      "unfriendly",
      "whispering",
      "hopeful",
    ]
  }

  // ---

  jsonForVoiceShortName (shortName) {
    return this.voicesJson().find(entry => entry.ShortName === shortName);
  }

  voiceSupportsStyle (styleName) {
    const json = this.jsonForVoiceShortName(this.voiceName())
    return json.StyleList && json.StyleList.includes(styleName);
  }

  setIsMuted (aBool) {
    this._isMuted = aBool;
    if (aBool) {
      this.pause();
    } else {
      this.resume();
    }
    return this;
  }

  selectedLanguageValue () {
    return this.optionValueForLabel(this.language())
  }

  languageOptionLabels () {
    return this.languageOptions().map(dict => dict.label)
  }

  optionValueForLabel (label) {
    const option = this.languageOptions().select(option => option.label === label || option.value === label)
    return option ? option.value : undefined;
  }

  languageOptions () {
    const options = [];
    const localNames = new Set();
    this.voicesJson().forEach(entry => {
      const k = entry.LocaleName;
      const v = entry.ShortName;
      if (k.startsWith("en-US") && v !== "en-US-TonyNeural") {
        // ensure we only use "en-US-TonyNeural" for en-US
        return;
      }
      if (!localNames.has(k)) {
        options.push({ label: k, value: v});
        localNames.add(k);
      }
    });
    
    // Add placeholder option at start
    //options.unshift({ label: 'Select language...', value: '' });
  
    return options;
  }  

  async asyncSpeakTextIfAble (text) {
    if (this.hasApiAccess()) {
      await this.asyncSpeakText(text);
    }
  }

  supportedVoiceStyle () {
    return this.voiceSupportsStyle(this.voiceStyle()) ? this.voiceStyle() : null;
  }

  /*
  cleanText(text) {
    // make sure we don't lose the whitespace formatting as we need it for pacing
    text = text.replaceAll("<p>", ""); 
    text = text.replaceAll("</p>", "\n\n"); 
    text = text.replaceAll("<br>", "\n\n"); 
    //text = text.replaceAll(".", "\n\n"); 

    text = text.removedHtmlTags(); 

    text = text.replaceAll(" - ", "... "); // quick hack to get the pause length right for list items
    //text = text.replaceAll(".\n\n", "...\n\n"); // quick hack to get the pause length right for list items
    return text;
  }
  */

  pitchString () {
    return this.pitch() + "%"
  }

  rateString () {
    return this.pitch() + "%"
  }

  ssmlRequestForText(text) {
    let s = `<prosody volume='soft' rate='${this.rateString()}' pitch='${this.pitchString()}'>${text}</prosody>`;

    const style = this.supportedVoiceStyle();
    if (style) {
      // wrap it in a style, if one is specified and supported
      s = `<mstts:express-as style='${style}'>${s}</mstts:express-as>`
    }
    
    const ssmlRequest = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${this.selectedLanguageValue()}'>
        <voice name='${this.voiceName()}'>
          ${s}
        </voice>
      </speak>`;
    return ssmlRequest;
  }

  /*
  async asyncSpeakText(text) {
    if (this.isMuted()) {
      return;
    }

    text = this.cleanText(text);
    this.debugLog("asyncSpeakText(" + text + ")");

    //this.debugLog("made request")
    const response = await fetch(`https://${this.region()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey(),
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      },
      body: this.ssmlRequestForText(text),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    this.queueAudioBlob(audioBlob);
  }
  */

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

  speakers () {
    return this.parentNode()
  }

  service () {
    return this.speakers().service()
  }

}.initThisClass());

