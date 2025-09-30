"use strict";

/* 
    ElevenLabsSfxSession
 
    Text to Sound Effects

*/

(class ElevenLabsSfxSession extends BMSummaryNode {

  initPrototypeSlots () {

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(false);

    this.setNodeSubtitleIsChildrenSummary(true);
    this.setTitle("Text to Sound Effect Session");
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
    this.audioQueue().queueSvWaSound(sound);
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
  
  pause () {
    this.debugLog("pause()");
    this.audioQueue().pause();
  }

  resume () {
    this.debugLog("resume()");
    this.audioQueue().resume();
  }

}.initThisClass());
