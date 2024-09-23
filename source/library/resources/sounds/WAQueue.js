/**
 * @module sounds
 */

/**
 * @class WAQueue
 * @extends BMSummaryNode
 * @classdesc WAQueue for managing audio playback queue.
 * 
 * Use:
 * 
 * const waq = WAQueue.clone()
 * waq.pushSound(waSound1);
 * waq.pushSound(waSound2);
 * 
 * waSound just needs to respond to play() and post a onSoundEnded()
 */
"use strict";

(class WAQueue extends BMSummaryNode {

  /**
   * @description Initializes the prototype slots for the WAQueue.
   */
  initPrototypeSlots () {

    /**
     * @property {Boolean} isMuted - Indicates if the queue is muted.
     */
    {
      const slot = this.newSlot("isMuted", false);
      slot.setSlotType("Boolean");
    }

    /**
     * @property {Object} currentSound - The currently playing sound.
     */
    {
      const slot = this.newSlot("currentSound", null);
      slot.setSlotType("Object"); // TODO use protocol
    }

    /**
     * @property {Array} soundQueue - The queue of sounds to be played.
     */
    {
      const slot = this.newSlot("soundQueue", null);
      slot.setSlotType("Array");
    }

    this.setNodeSubtitleIsChildrenSummary(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the prototype.
   */
  initPrototype () {
    this.setCanDelete(true);
  }

  /**
   * @description Initializes the WAQueue instance.
   */
  init () {
    super.init();
    this.setTitle("Audio Queue");
    this.setAudioBlobQueue([]);
  }

  /**
   * @description Checks if a sound is currently playing.
   * @returns {Boolean} True if a sound is playing, false otherwise.
   */
  isPlaying () {
    return this.currentSound() !== null;
  }

  /**
   * @description Generates the subtitle for the WAQueue.
   * @returns {string} The subtitle string.
   */
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

  /**
   * @description Sets the muted state of the queue.
   * @param {Boolean} aBool - The muted state to set.
   * @returns {WAQueue} The instance for method chaining.
   */
  setIsMuted (aBool) {
    this._isMuted = aBool;
    if (aBool) {
      this.pause();
    } else {
      this.resume();
    }
    return this;
  }

  /**
   * @description Pushes a sound to the queue and processes it.
   * @param {Object} waSound - The sound to push to the queue.
   * @returns {WAQueue} The instance for method chaining.
   */
  pushSound (waSound) {
    this.soundQueue().push(waSound);
    this.processQueue();
    this.didUpdateNode();
    return this;
  }

  /**
   * @description Processes the sound queue.
   * @returns {WAQueue} The instance for method chaining.
   */
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

  /**
   * @description Plays an audio blob.
   * @param {Object} waSound - The sound to play.
   * @returns {WAQueue} The instance for method chaining.
   */
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

  /**
   * @description Handles the end of a sound playback.
   * @param {Object} waSound - The sound that ended.
   */
  onSoundEnded (waSound) {
    this.debugLog("finished playing");
    this.setCurrentSound(null);
    this.processQueue();
    this.didUpdateNode();
  }
  
  /**
   * @description Stops the current sound playback.
   */
  stop () {
    this.debugLog("pause()");

    const sound = this.currentSound();
    if (sound) {
      sound.stop();
      this.debugLog("paused");
    }
  }

  /**
   * @description Resumes the current sound playback.
   */
  resume () {
    this.debugLog("resume()");

    const audio = this.currentSound();
    if (audio) {
      audio.play();
      this.debugLog("resumed");
    }
  }

  /**
   * @description Stops the current playback and clears the queue.
   */
  stopAndClearQueue () {
    this.soundQueue().clear();
    this.stop();
  }

}.initThisClass());