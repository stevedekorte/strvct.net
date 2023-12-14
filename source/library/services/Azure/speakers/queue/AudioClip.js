"use strict";

/* 
    AudioClip 

*/

(class AudioClip extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("transcript", false);
    }

    {
      const slot = this.newSlot("audioBlob", null);
    }

    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init();
    this.setTitle("AudioClip");
    this.setAudioBlobQueue([]);

  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  subtitle () {
    const lines = [];
    lines.push(this.transcript().clipWithEllipsis(20));
    lines.push(this.sizeInBytes() + " bytes");
    lines.push(this.lengthInSeconds() + " seconds");
    return lines.join("\n");
  }

  newAudioObject () {
    const audioBlob = this.audioBlob();
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      return audio;
    }
    return null
  }

  sizeInBytes () {
    if (this.audioBlob()) {
      return this.audioBlob().size;
    }
    return 0;
  }

  lengthInSeconds () {
    const audio = this.newAudioObject();
    if (audio) {
      return audio.duration;
    }
    return 0;
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

  // ---

  queueAudioBlob (audioBlob) {
    this.audioBlobQueue().push(audioBlob);
    this.processQueue();
    this.didUpdateNode();
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
      // URL.createObjectURL(), unlike FileReader.readAsDataURL(),
      // does not give access to the converted URL
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
    this.didUpdateNode();
  }
  
  pause () {
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

