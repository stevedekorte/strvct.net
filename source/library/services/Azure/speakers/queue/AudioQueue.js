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
    }

    {
      const slot = this.newSlot("queue", null);
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
    const isPlaying = this.currentAudio() !== null;
    
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

  queueWASound (waSound) {
    this.queue().push(waSound);
    this.processQueue();
    this.didUpdateNode();
  }

  processQueue () {
    if (!this.currentAudio()) {
      const q = this.queue();
      if (q.length) {
        const sound = q.shift();
        this.playSound(sound);
      }
    }
    return this;
  }

  async playSound (sound) {
    this.pause();
    if (!this.isMuted()) {
      //sound.setData(audioBlob);
      sound.setDelegate(this);
      this.setCurrentAudio(sound);
      sound.play(); // returns a promise

      // URL.createObjectURL(), unlike FileReader.readAsDataURL(),
      // does not give access to the converted URL
      /*
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      this.setCurrentAudio(audio);
      audio.onended = () => { this.onAudioEnd(audio); }
      */
      //HostSession.shared().broadcastPlayAudioBlob(audioBlob);
    } else {
      this.processQueue();
    }
    return this;
  }

  onSoundEnded (waSound) {
    this.onAudioEnd(null);
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

