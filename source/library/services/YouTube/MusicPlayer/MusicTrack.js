"use strict";

/**
 * @module library.services.YouTube.MusicPlayer
 */

/**
 * @class MusicTrack
 * @extends BMSummaryNode
 * @classdesc Represents a music track in the music player.
 */
(class MusicTrack extends BMSummaryNode {

  /**
   * Initializes the prototype slots for the MusicTrack class.

   */
  initPrototypeSlots () {
    /**
     * @property {string} name - The name of the music track.
     */
    {
      const slot = this.newSlot("name", "unnamed");
      slot.setLabel("name");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    /**
     * @property {string} trackId - The ID of the music track.
     */
    {
      const slot = this.newSlot("trackId", null);
      slot.setInspectorPath("");
      slot.setLabel("id");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    /**
     * @property {Object} togglePlayAction - The action to toggle play/stop.
     */
    {
      const slot = this.newSlot("togglePlayAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Play");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("togglePlay");
    }

    /**
     * @property {boolean} shouldPlayOnAccess - Whether the track should play on access.
     */
    {
      const slot = this.newSlot("shouldPlayOnAccess", true);
      slot.setSlotType("Boolean");
    }

    /**
     * @property {boolean} isPlaying - Indicates if the track is currently playing.
     */
    {
      const slot = this.newSlot("isPlaying", false);
      slot.setSyncsToView(true);
      slot.setSlotType("Boolean");
    }

    /**
     * @property {Set} delegateSet - The set of delegates for this track.
     */
    {
      const slot = this.newSlot("delegateSet", null);
      slot.setSlotType("Set");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * Initializes the MusicTrack instance.

   */
  init() {
    super.init();
    this.setDelegateSet(new Set());
  }

  /**
   * Performs final initialization of the MusicTrack instance.

   */
  finalInit () {   
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
    super.finalInit();
  }

  /**
   * Returns the title of the music track.

   * @returns {string} The name of the track.
   */
  title () {
    return this.name();
  }

  /**
   * Returns the subtitle of the music track.

   * @returns {string} "playing" if the track is playing, otherwise an empty string.
   */
  subtitle () {
    return this.isPlaying() ? "playing" : "";
  }

  /**
   * Returns the parent library of this track.

   * @returns {MusicLibrary} The parent music library.
   */
  library () {
    return this.firstParentChainNodeOfClass(MusicLibrary)
  }

  /**
   * Returns the parent folder of this track.

   * @returns {MusicFolder} The parent music folder.
   */
  folder () {
    return this.firstParentChainNodeOfClass(MusicFolder)
  }

  /**
   * Plays the music track.

   * @async
   */
  async play () {
    const player = this.library().musicPlayer()
    player.setTrackName(this.name());
    player.setVideoId(this.trackId());
    player.setShouldRepeat(false);

    this.setIsPlaying(true);
    this.post("onSoundStarted");
    await player.play();

    this.setIsPlaying(false);
    this.post("onSoundEnded");
  }

  /**
   * Stops the music track.

   * @async
   */
  async stop () {
    const player = this.library().musicPlayer()
    await player.stop();
    this.setIsPlaying(false);

    this.post("onSoundEnded");
  }

  /**
   * Checks if this is a music track.

   * @returns {boolean} Always returns true.
   */
  isMusicTrack () {
    return true;
  }

  /**
   * Toggles the play state of the track.

   * @returns {MusicTrack} This instance.
   */
  togglePlay () {
    if (this.isPlaying()) {
      this.stop();
    } else {
      this.play();
    }
    return this;
  }

  /**
   * Returns information about the toggle play action.

   * @returns {Object} An object containing action information.
   */
  togglePlayActionInfo () {
    return {
      isEnabled: true,
      title: this.isPlaying() ? "Stop" : "Play",
      isVisible: true,
    };
  }

  /**
   * Posts a note and sends it to delegates.

   * @param {string} methodName - The name of the method to post.
   * @returns {MusicTrack} This instance.
   */
  post (methodName) {
    this.postNoteNamed(methodName);
    this.sendDelegate(methodName);
    return this;
  }

  /**
   * Adds a delegate to the delegate set.

   * @param {Object} d - The delegate to add.
   * @returns {MusicTrack} This instance.
   */
  addDelegate (d) {
      this.delegateSet().add(d);
      return this;
  }

  /**
   * Removes a delegate from the delegate set.

   * @param {Object} d - The delegate to remove.
   * @returns {MusicTrack} This instance.
   */
  removeDelegate (d) {
      this.delegateSet().delete(d);
      return this;
  }

  /**
   * Sends a method call to all delegates.

   * @param {string} methodName - The name of the method to call on delegates.
   * @param {Array} [args=[this]] - The arguments to pass to the delegate method.
   */
  sendDelegate (methodName, args = [this]) {
      const sendDelegate = (d, methodName, args) => {
          const f = d[methodName]
          if (f) {
            f.apply(d, args)
          }
      };

      this.delegateSet().forEach(d => { 
          sendDelegate(d, methodName, args); 
      });
  }

}).initThisClass();