"use strict";

/**
 * @module library.services.Azure.speakers
 */

/**
 * Represents an Azure Speaker with various voice and speech settings.
 * @class
 * @extends BMSummaryNode
 * @classdesc AzureSpeaker

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
  /**
   * Initializes the prototype slots for the AzureSpeaker class.

   */
  initPrototypeSlots () {
    /*
    {
      const slot = this.newSlot("service", null);
    }
    */

    /**
     * @member {string} localeName - The language/locale name for the speaker.
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

    /**
     * @member {string} displayName - The display name for the speaker.
     */
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

    /**
     * @member {string} voiceStyle - The style of the voice for the speaker.
     */
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
    
    /**
     * @member {string} volume - The volume setting for the speaker.
     */
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
    
    /**
     * @member {number} rate - The rate adjustment percentage for the speaker.
     */
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

    /**
     * @member {number} pitch - The pitch adjustment percentage for the speaker.
     */
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

    /**
     * @member {boolean} isMuted - Indicates whether the speaker is muted.
     */
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

    /**
     * @member {Object} currentAudio - The current audio object.
     */
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

    /**
     * @member {Object} audioQueue - The audio queue object.
     */
    {
      const slot = this.newSlot("audioQueue", null);
    }

    /**
     * @member {Array} audioBlobQueue - The queue of audio blobs.
     */
    {
      const slot = this.newSlot("audioBlobQueue", null);
    }

    /**
     * @member {Object} requests - The Azure TTS requests object.
     */
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

  /**
   * Initializes the AzureSpeaker instance.

   */
  init () {
    super.init();
    this.setTitle("Azure Speaker");
    this.setAudioQueue(AudioQueue.clone());
    this.setAudioBlobQueue([]);

  }

  /**
   * Performs final initialization of the AzureSpeaker instance.

   */
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);

  }

  // --- helpers ---

  /**
   * Gets the parent speakers object.

   * @returns {Object} The parent speakers object.
   */
  speakers () {
    return this.parentNode() // why doesn't this work?
  }

  /**
   * Gets the Azure service object.

   * @returns {Object} The Azure service object.
   */
  service () {
    return this.speakers().service()
  }

  /**
   * Gets the available voices.

   * @returns {Array} The available voices.
   */
  voices () {
    return this.service().voices()
  }

  // --- selection ---

  /**
   * Gets the valid locale names.

   * @returns {Array} The valid locale names.
   */
  validLocaleNames () {
    return this.voices().localeNames()
  }

  /**
   * Gets the valid display names for the current locale.

   * @returns {Array} The valid display names.
   */
  validDisplayNames () {
    const localeMatches = this.voices().voicesForMethodNameAndValue("localeName", this.localeName())
    const displayNames = localeMatches.map(voice => voice.displayName())
    return displayNames
  }

  /**
   * Gets the selected voice based on the current locale and display name.

   * @returns {Object} The selected voice object.
   */
  selectedVoice () {
    // localeName + displayName should be enough to select a unique voice
    const localeMatches = this.voices().voicesForMethodNameAndValue("localeName", this.localeName())
    const displayNameMatches = localeMatches.select(voice => voice.displayName() === this.displayName())
    const match = displayNameMatches.first()
    return match
  }

  /**
   * Gets the short name of the selected voice.

   * @returns {string} The short name of the selected voice.
   */
  shortName () {
    const v = this.selectedVoice()
    return v ? v.shortName() : null;
  }

  // ---------------------

  /**
   * Gets the valid volume settings.

   * @returns {Array} The valid volume settings.
   */
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

  /**
   * Gets the valid voice styles for the selected voice.

   * @returns {Array} The valid voice styles.
   */
  validVoiceStyles () {
    const styles = this.selectedVoice().styleList()
    return styles !== null ? styles : []
  }
  
  // ---

  /**
   * Sets the muted state of the audio queue.

   * @param {boolean} aBool - The muted state to set.
   * @returns {Object} The AzureSpeaker instance.
   */
  setIsMuted (aBool) {
    this.audioQueue().setIsMuted(aBool);
    return this;
  }

  /**
   * Gets the muted state of the audio queue.

   * @returns {boolean} The muted state of the audio queue.
   */
  isMuted () {
    return this.audioQueue().isMuted();
  }

  // ---

  /**
   * Gets the locale of the selected voice.

   * @returns {string} The locale of the selected voice.
   */
  locale () {
    const voice = this.selectedVoice()
    return voice ? voice.locale() : null;
  }

  /**
   * Gets the pitch as a string with a percentage symbol.

   * @returns {string} The pitch as a string with a percentage symbol.
   */
  pitchString () {
    return this.pitch() + "%"
  }

  /**
   * Gets the rate as a string with a percentage symbol.

   * @returns {string} The rate as a string with a percentage symbol.
   */
  rateString () {
    return this.pitch() + "%"
  }

  // -------------------------------------

  /**
   * Generates an SSML request for the given text.

   * @param {string} text - The text to generate SSML for.
   * @returns {string} The SSML request string.
   */
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

  /**
   * Queues an audio blob in the audio queue.

   * @param {Blob} audioBlob - The audio blob to queue.
   * @returns {Object} The AzureSpeaker instance.
   */
  queueAudioBlob (audioBlob) { // called by the request once it's complete
    this.audioQueue().queueAudioBlob(audioBlob);
    return this;
  }
  
  /**
   * Pauses the audio queue.

   */
  pause() {
    this.debugLog("pause()");
    this.audioQueue().pause();
  }

  /**
   * Resumes the audio queue.

   */
  resume () {
    this.debugLog("resume()");
    this.audioQueue().resume();
  }

}.initThisClass());