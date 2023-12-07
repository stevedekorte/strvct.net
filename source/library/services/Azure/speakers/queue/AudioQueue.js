"use strict";

/* 
    AudioQueue

*/

(class AudioQueue extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("isMuted", false);
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
    this.setTitle("Audio Queue");
    this.setAudioBlobQueue([]);

  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  subtitle () {
    const lines = [];
    const qSize = this.audioBlobQueue().length;
    const isPlaying = this.currentAudio() !== null;
    
    if (isPlaying) {
      lines.push("playing");
    }

    if (qSize) {
      lines.push(qSize + " clips queued");
    }

    if (this.isMuted()) {
      lines.push("muted");
    }

    return lines.join("\n");
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

  // -----------------------------------

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

