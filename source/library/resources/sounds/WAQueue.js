"use strict";

/* 
    WAQueue 

    Use:

    const waq = WAQueue.clone()
    waq.pushSound(waSound1);
    waq.pushSound(waSound2);

    waSound just needs to respond to play() and post a onSoundEnded()


*/

(class WAQueue extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("isMuted", false);
    }

    {
      const slot = this.newSlot("currentSound", null);
    }

    {
      const slot = this.newSlot("soundQueue", null);
    }

    this.setNodeSubtitleIsChildrenSummary(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setTitle("Audio Queue");
    this.setAudioBlobQueue([]);

  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  isPlaying () {
    return this.currentSound() !== null;
  }

  subtitle () {
    const lines = [];
    const qSize = this.soundQueue().length;
    
    if (this.isPlaying()) {
      lines.push("playing");
    }

    if (qSize) {
      lines.push(qSize + " sounds queued");
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

  pushSound (waSound) {
    this.soundQueue().push(waSound);
    this.processQueue();
    this.didUpdateNode();
    return this;
  }

  processQueue () {
    if (!this.currentSound()) {
      const q = this.soundQueue();
      if (q.length) {
        const waSound = q.shift();
        this.playSound(waSound);
      }
    }
    return this;
  }

  playAudioBlob (waSound) {
    this.pause();
    if (!this.isMuted()) {
      this.watchOnceForNoteFrom(waSound);
      waSound.play()
      this.setCurrentSound(waSound);
    } else {
      this.processQueue();
    }
    return this;
  }

  onSoundEnded (audio) {
    this.debugLog("finished playing");
    this.setCurrentSound(null);
    this.processQueue();
    this.didUpdateNode();
  }
  
  pause () {
    this.debugLog("pause()");

    const sound = this.currentSound();
    if (sound) {
      sound.stop();
      this.debugLog("paused");
    }
  }

  resume () {
    this.debugLog("resume()");

    const audio = this.currentSound();
    if (audio) {
      //if (audio.paused) {
        audio.play();
        this.debugLog("resumed");
      //}
    }
  }

}.initThisClass());

