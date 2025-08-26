"use strict";

/**
 * @module library.node.audio
 * @class AudioQueue
 * @extends SvSummaryNode
 * @implements {AudioClipDelegateProtocol}
 * @classdesc Manages a queue of audio clips.
 * 
 * Example use:
 * In cases such as text-to-speech of sentences from a streaming LLM,
 * we need to queue the speech audio clips as they come in, and play them in order.
 * 
 * The audio clips must implement the AudioClipProtocol protocol and 
 * are expected to call the AudioClipDelegate methods as appropriate.
 * 
 * Audio clips must implement this protocol:
 * - play()
 * - addDelegate(delegate)
 * - removeDelegate(delegate)
 * - stop()
 */

(class AudioQueue extends SvSummaryNode { 

  /**
   * @category Initialization
   * @description Initializes the prototype slots for the audio queue.
   */
  initPrototypeSlots () {
    /**
     * @member {boolean} isMuted - Whether the audio queue is muted.
     */
    {
      const slot = this.newSlot("isMuted", false);
      slot.setSlotType("Boolean");
    }

    /**
     * @member {Object} currentSound - The current sound.
     */
    {
      const slot = this.newSlot("currentSound", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {Array} queue - The queue of sounds.
     */
    {
      const slot = this.newSlot("queue", null); // FIFO (first in first out) queue
      slot.setSlotType("Array");
    }

    this.setNodeSubtitleIsChildrenSummary(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @category Initialization
   * @description Initializes the prototype by adding required protocols.
   */
  initPrototype () {
    /*
    const slot = this.slotNamed("shortName")
    slot.setValidValues(this.validShortNames())
    */
    this.addProtocol(AudioClipDelegateProtocol);
  }


  /**
   * @category Initialization
   * @description Initializes the audio queue.
   */
  init () {
    super.init();
    this.setTitle("Audio Queue");
    this.setQueue([]);
  }

  /**
   * @category Initialization
   * @description Performs final initialization steps.
   */
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  /**
   * @description Returns the subtitle of the audio queue.
   * @returns {string} The subtitle.
   * @category Information
   */
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

  /**
   * @description Returns the size of the queue.
   * @returns {number} The size of the queue.
   * @category Information
   */
  queueSize () {
    return this.queue().length;
  }

  // ---

  /**
   * @category Mutation
   * @description Sets the muted state of the audio queue.
   * @param {boolean} aBool - The muted state.
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

  // -----------------------------------

  /**
   * @category Queue Management
   * @description Queues an audio blob.
   * @param {Blob} audioBlob - The audio blob.
   * @returns {SvWaSound} The sound.
   */
  queueAudioBlob (audioBlob) {
    audioBlob.assertConformsToProtocol("AudioClipProtocol");
    const sound = SvWaSound.fromBlob(audioBlob);
    this.queueSvWaSound(sound);
    return sound;
  }

  /**
   * @category Queue Management
   * @description Queues a SvWaSound.
   * @param {SvWaSound} sound - The SvWaSound.
   */
  queueSvWaSound (sound) {
    // e.g. sound could be a SvWaSound or YouTube MusicTrack
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

  /**
   * @category Queue Management
   * @description Processes the next item in the queue if no sound is currently playing.
   * @returns {AudioQueue} The audio queue instance.
   */
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

  /**
   * @async
   * @category Playback Control
   * @description Plays a sound.
   * @param {SvWaSound} sound - The sound.
   */
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

  /**
   * @category Playback Control
   * @description Handles the end of a sound.
   * @param {SvWaSound} waSound - The sound.
   */
  onSoundEnded (waSound) {
    waSound.removeDelegate(this);
    this.debugLog("finished playing");
    this.setCurrentSound(null);
    this.processQueue();
    this.didUpdateNode();
  }
  
  /**
   * @category Playback Control
   * @description Pauses the current sound if one is playing.
   * @throws {Error} Pause is not currently supported.
   */
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

  /**
   * @category Playback Control
   * @description Resumes playing the current sound if one is paused.
   */
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

  /**
   * @category Queue Management
   * @description Stops the current sound and removes all items from the queue.
   */
  stopAndClearQueue () {
    const audio = this.currentSound();
    if (audio) {
        audio.stop();
        // this.onSoundEnded(audio); // needed?
    }
    this.setQueue([]);
  }

  /**
   * @category Debug
   * @description Returns a debug description of the audio queue.
   * @returns {string} The debug description.
   */
  debugDescription () {
    return this.type() + " " + this.id();
  }

}.initThisClass());