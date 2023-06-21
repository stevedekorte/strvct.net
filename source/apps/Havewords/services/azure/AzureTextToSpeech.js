"use strict";

/* 
    AzureTextToSpeech

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

(class AzureTextToSpeech extends AzureService {
  initPrototypeSlots () {
    this.newSlot("language", "en-US");
    this.newSlot("voiceName", "en-US-TonyNeural");
    this.newSlot("voiceStyle", "whispering");
    this.newSlot("voicesJson", null);
    this.newSlot("volume", "soft");
    //this.newSlot("rate", "15%");
    this.newSlot("rate", "10%");
    this.newSlot("pitch", "-10%");
    this.newSlot("isMuted", false);
    this.newSlot("currentAudio", null);
    this.newSlot("audioBlobQueue", null);
  }

  init () {
    super.init();
    this.setAudioBlobQueue([]);
  }

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
    options.unshift({ label: 'Select language...', value: '' });
  
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

  ssmlRequestForText(text) {
    let s = `<prosody volume='soft' rate='${this.rate()}' pitch='${this.pitch()}'>${text}</prosody>`;

    const style = this.supportedVoiceStyle();
    if (style) {
      // wrap it in a style, if one is specified and supported
      s = `<mstts:express-as style='${style}'>${s}</mstts:express-as>`
    }
    
    const ssmlRequest = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${this.language()}'>
        <voice name='${this.voiceName()}'>
          ${s}
        </voice>
      </speak>`;
    return ssmlRequest;
  }

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
      audio.onended = () => { this.onAudiEnd(audio); }

      HostSession.shared().broadcastPlayAudioBlob(audioBlob);
    } else {
      this.processQueue();
    }
    return this;
  }

  onAudiEnd (audio) {
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

