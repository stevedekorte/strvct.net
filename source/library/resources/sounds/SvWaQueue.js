/**
 * @module library.resources.sounds
 */

/**
 * @class SvWaQueue
 * @extends SvSummaryNode
 * @classdesc SvWaQueue for managing audio playback queue.
 * 
 * Use:
 * 
 * const waq = SvWaQueue.clone()
 * waq.pushSound(waSound1);
 * waq.pushSound(waSound2);
 * 
 * waSound just needs to respond to play() and post a onSoundEnded()
 */
"use strict";

(class SvWaQueue extends SvSummaryNode {

  /**
   * @description Initializes the prototype slots for the SvWaQueue.
   * @category Initialization
   */
  initPrototypeSlots () {

    /**
     * @member {Boolean} isMuted - Indicates if the queue is muted.
     * @category State
     */
    {
      const slot = this.newSlot("isMuted", false);
      slot.setSlotType("Boolean");
    }

    /**
     * @member {Object} currentSound - The currently playing sound.
     * @category State
     */
    {
      const slot = this.newSlot("currentSound", null);
      slot.setSlotType("Object"); // TODO use protocol
    }

    /**
     * @member {Array} soundQueue - The queue of sounds to be played.
     * @category State
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
   * @category Initialization
   */
  initPrototype () {
    this.setCanDelete(true);
  }

  /**
   * @description Initializes the SvWaQueue instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setTitle("Audio Queue");
    this.setAudioBlobQueue([]);
  }

  /**
   * @description Checks if a sound is currently playing.
   * @returns {Boolean} True if a sound is playing, false otherwise.
   * @category Playback
   */
  isPlaying () {
    return this.currentSound() !== null;
  }

  /**
   * @description Generates the subtitle for the SvWaQueue.
   * @returns {string} The subtitle string.
   * @category UI
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
   * @returns {SvWaQueue} The instance for method chaining.
   * @category Playback
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
   * @returns {SvWaQueue} The instance for method chaining.
   * @category Queue Management
   */
  pushSound (waSound) {
    this.soundQueue().push(waSound);
    this.processQueue();
    this.didUpdateNode();
    return this;
  }

  /**
   * @description Processes the sound queue.
   * @returns {SvWaQueue} The instance for method chaining.
   * @category Queue Management
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
   * @returns {SvWaQueue} The instance for method chaining.
   * @category Playback
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
   * @category Event Handling
   */
  onSoundEnded (waSound) {
    this.logDebug("finished playing");
    this.setCurrentSound(null);
    this.processQueue();
    this.didUpdateNode();
  }
  
  /**
   * @description Stops the current sound playback.
   * @category Playback
   */
  stop () {
    this.logDebug("pause()");

    const sound = this.currentSound();
    if (sound) {
      sound.stop();
      this.logDebug("paused");
    }
  }

  /**
   * @description Resumes the current sound playback.
   * @category Playback
   */
  resume () {
    this.logDebug("resume()");

    const audio = this.currentSound();
    if (audio) {
      audio.play();
      this.logDebug("resumed");
    }
  }

  /**
   * @description Stops the current playback and clears the queue.
   * @category Queue Management
   */
  stopAndClearQueue () {
    this.soundQueue().clear();
    this.stop();
  }

}.initThisClass());