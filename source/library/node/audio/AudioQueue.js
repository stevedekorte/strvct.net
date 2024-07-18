"use strict";

/* 
    AudioQueue 

    sound protocol:
    play()
    addDelegate(delegate)
    removeDelegate(delegate)
    stop()

*/

(class AudioQueue extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("isMuted", false);
      slot.setSlotType("Boolean");
    }

    {
      const slot = this.newSlot("currentSound", null);
      slot.setSlotType("Object");
    }

    {
      const slot = this.newSlot("queue", null); // FIFO (first in first out) queue
      slot.setSlotType("Array");
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
    this.setQueue([]);
  }

  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  subtitle () {
    const lines = [];
    const isPlaying = this.currentSound() !== null;
    
    if (isPlaying) {
      lines.push("playing");
    }

    if (this.queueSize()) {
      lines.push(this.queueSize() + " clips queued");
    }

    if (this.isMuted()) {
      lines.push("muted");
    }

    return lines.join("\n");
  }

  queueSize () {
    return this.queue().length;
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
    const sound = WASound.fromBlob(audioBlob);
    this.queueWASound(sound);
    return sound;
  }

  queueWASound (sound) {
    // e.g. sound could be a WASound or YouTube MusicTrack
    // just needs to support the protocol

    // verify sound protocol
    assert(sound.play);
    assert(sound.stop);
    assert(sound.addDelegate);
    assert(sound.removeDelegate);

    //console.log(this.type() + " PUSH " + sound.description());
    this.queue().push(sound);
    this.processQueue();
    this.didUpdateNode();
  }

  processQueue () {
    if (!this.currentSound()) {
      const q = this.queue();
      if (q.length) {
        const sound = q.shift();
        //console.log(this.type() + " POP " + sound.description());
        this.playSound(sound);
      }
    }
    return this;
  }

  async playSound (sound) {
    //this.pause();
    if (!this.isMuted()) {
      //sound.setData(audioBlob);
      sound.addDelegate(this);
      this.setCurrentSound(sound);
      sound.play(); // returns a promise
    } else {
      this.processQueue();
    }
    return this;
  }

  onSoundEnded (waSound) {
    waSound.removeDelegate(this);
    this.debugLog("finished playing");
    this.setCurrentSound(null);
    this.processQueue();
    this.didUpdateNode();
  }
  
  pause () {
    throw new Error("pause not supported");
    /*
    this.debugLog("pause()");

    const audio = this.currentSound();
    if (audio) {
      audio.pause();
      this.debugLog("paused");
    }
    */
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

  stopAndClearQueue () {
    const audio = this.currentSound();
    if (audio) {
        audio.stop();
        // this.onSoundEnded(audio); // needed?
    }
    this.setQueue([]);
  }

}.initThisClass());