/**
 * @module library.services.YouTube
 */

/**
 * @class YouTubeAudioPlayer
 * @extends SvStorableNode
 * @classdesc YouTubeAudioPlayer
 * 
 * One shot use example:
 * 
 *   const player = YouTubeAudioPlayer.clone();
 *   player.setTrackName(this.name());
 *   player.setVideoId(this.trackId());
 *   player.setShouldRepeat(false);
 *   await player.play();
 *   await player.shutdown();
 */
(class YouTubeAudioPlayer extends SvStorableNode {

  /**
   * @description Initializes the prototype slots for the YouTubeAudioPlayer.
   */
  initPrototypeSlots () {

    /**
     * @member {Element} element - The DOM element for the player.
     */
    {
      const slot = this.newSlot("element", null);
      slot.setSyncsToView(true);
      slot.setSlotType("Element");
    }
    
    /**
     * @member {Promise} playerPromise - Resolves once player is available.
     */
    { 
      const slot = this.newSlot("playerPromise", null);
      slot.setSlotType("Promise");
    }

    /**
     * @member {Promise} playPromise - Promise for play operation.
     */
    {
      const slot = this.newSlot("playPromise", null);
      slot.setSlotType("Promise");
    }

    /**
     * @member {Object} player - Reference to store the YouTube player.
     */
    {
      const slot = this.newSlot("player", null);
      slot.setSyncsToView(true);
      slot.setSlotType("Object");
    }

    /**
     * @member {string} stateName - Current state of the player.
     */
    {
      const slot = this.newSlot("stateName", "");
      slot.setInspectorPath("");
      slot.setLabel("Status");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} trackName - Name of the current track.
     */
    {
      const slot = this.newSlot("trackName", "");      
      slot.setInspectorPath("");
      slot.setLabel("track name");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} videoId - ID of the current video.
     */
    {
      const slot = this.newSlot("videoId", null);      
      slot.setInspectorPath("");
      slot.setLabel("track id");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {boolean} shouldRepeat - Whether the track should repeat.
     */
    {
      const slot = this.newSlot("shouldRepeat", true);      
      slot.setCanEditInspection(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath("");
      slot.setIsSubnodeField(true);
      slot.setLabel("repeat");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Boolean");
    }

    /**
     * @member {boolean} mute - Whether the player is muted.
     */
    {
      const slot = this.newSlot("mute", false);      
      slot.setCanEditInspection(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath("");
      slot.setIsSubnodeField(true);
      slot.setLabel("mute");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Boolean");
    }

    /**
     * @member {number} volume - Volume of the player.
     */
    {
      const slot = this.newSlot("volume", 0.05);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setAllowsMultiplePicks(false);
      slot.setValidValues(this.validVolumeValues());
    }

    /**
     * @member {Action} togglePlayAction - Action to toggle play/pause.
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

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the YouTubeAudioPlayer.
   */
  init () {
    super.init();
    this.setIsDebugging(false);
  }

  /**
   * @description Gets or creates the player promise.
   * @returns {Promise} The player promise.
   */
  playerPromise () {
    if (!this._playerPromise) {
      this._playerPromise = Promise.clone().setLabel(this.type() + " setup");
      this.setupFrame();
    }
    return this._playerPromise
  }

  /**
   * @description Performs final initialization of the YouTubeAudioPlayer.
   */
  finalInit () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    
    super.finalInit();
    this.setTitle("YouTube Audio Player");
  }

  /**
   * @description Gets the subtitle for the player.
   * @returns {string} The subtitle.
   */
  subtitle () {
    if (this.isPlaying()) {
      const lines = []
      lines.push(this.stateName() + " '" + this.trackName() + "'");
      lines.push("volume: " + Math.round(this.volume()*100) + "%");
      return lines.join("\n");
    }
    return ""
  }

  /**
   * @description Gets valid volume values.
   * @returns {Array} Array of valid volume values.
   */
  validVolumeValues () {
    const values = [];
    let v = 0;
    while (v <= 1.0) {
      values.push(v);
      v += 0.05;
      v = Math.round(v*100)/100;
    }
    return values;
  }

  /**
   * @async
   * @description Sets up the frame for the player.
   */
  async setupFrame () {
    await EventManager.shared().firstUserEventPromise();
    await YouTubePlayerFrame.shared().frameReadyPromise();
    this.setupPlayer();
  }

  /**
   * @description Sets up the YouTube player.
   * @returns {YouTubeAudioPlayer} The player instance.
   */
  setupPlayer () {
    console.log("------------- setup YouTubePlayer ---------------");
    this.logDebug("setupPlayer()");
    const json = {
      height: "0",
      width: "0",
      events: {
        onReady: (event) => {
          this.onPlayerReady(event);
        },
        onStateChange: (event) => {
          this.onPlayerStateChange(event);
        },
        onError: (event) => {
          debugger;
          this.onPlayerError(event);
        },
      },
      playerVars: {
        autoplay: 1,
        controls: 0,
        showinfo: 0,
        rel: 0,
        modestbranding: 1,
      },
    };

    try {
      const e = document.createElement("div");
      this.setElement(e);
      e.id = "YouTubePlayer_" + this.puuid();
      e.style.display = "none";
      document.body.appendChild(e);
      const player = new YT.Player(e.id, json);
      assert(player);
      this.setPlayer(player);
    } catch (error) {
      console.warn(error);
      error.rethrow();
    }
    return this;
  }

  /**
   * @async
   * @description Plays the current video.
   * @returns {Promise} A promise that resolves when the video starts playing.
   */
  async play () {
    if (this.mute()) {
      return;
    }

    if (!this.videoId()) {
      return;
    }

    await this.playerPromise();
    this.logDebug("play() after promise");

    const startSeconds = 0.0;
    if (this.videoId()) {
      await this.resolvePlayPromise();
      await this.promiseUpdateVolume();


      this.setPlayPromise(Promise.clone().setLabel(this.type() + ".playPromise"));
      this.player().loadVideoById(this.videoId(), startSeconds);
      return this.playPromise();
    }
  }

  /**
   * @description Checks if the player is ready.
   * @returns {boolean} True if the player is ready, false otherwise.
   */
  isReady () {
    if (this._playerPromise) {
      return this.playerPromise().isResolved();
    }
    return false;
  }

  /**
   * @description Gets the map of player states.
   * @returns {Map} A map of player states.
   */
  statesMap () {
    const statesDict = {
      "3": "buffering",
      "5": "cued",
      "0": "ended",
      "2": "paused",
      "1": "playing",
      "-1": "unstarted"
    }
    const statesMap = new Map(Object.entries(statesDict));
    return statesMap;
  }

  /**
   * @description Gets the current state name of the player.
   * @returns {string} The current state name.
   */
  stateName () {
    if (this.isReady()) {
      const k = String(this.player().getPlayerState());
      assert(this.statesMap().has(k));
      return this.statesMap().get(k);
    }
    return "unitialized";
  }

  /**
   * @description Checks if the player is currently playing.
   * @returns {boolean} True if playing, false otherwise.
   */
  isPlaying () {
    if (this.isReady()) {
      const currentState = this.player().getPlayerState();
      const playStates = [YT.PlayerState.BUFFERING, YT.PlayerState.PLAYING];
      return playStates.includes(currentState);
    }
    return false;
  }

  /**
   * @description Handles player errors.
   * @param {Object} event - The error event.
   */
  onPlayerError (event) {
    debugger;
    const error = Number(event.data);
    this.logDebug(
      "------------------ onPlayerError " +
        error +
        " videoId: '" +
        this.videoId() +
        "'"
    );

    switch (error) {
      case 2:
        console.error(
          "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks."
        );
        break;
      case 5:
        console.error(
          "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred."
        );
        break;
      case 100:
        console.error("Video not found.");
        break;
      case 101:
      case 150:
        console.error(
          "The owner of the requested video does not allow it to be played in embedded players."
        );
        break;
      default:
        console.error("An unexpected error occurred while loading the video.");
    }
  }

  /**
   * @description Handles the player ready event.
   * @param {Object} event - The ready event.
   */
  onPlayerReady (/*event*/) {
    this.logDebug("onPlayerReady()");
    this.promiseUpdateVolume();

    assert(this._playerPromise);
    this.playerPromise().callResolveFunc();
  }

  /**
   * @description Handles player state changes.
   * @param {Object} event - The state change event.
   */
  onPlayerStateChange (event) {
    this.logDebug("onPlayerStateChange " + event.data);

    const state = Number(event.data);
    switch (state) {
      case -1:
        this.logDebug("Video unstarted");
        break;

      case YT.PlayerState.ENDED:
        this.logDebug("Video ENDED");
        this.onPlayerEnd(event);
        break;

      case YT.PlayerState.PLAYING:
        this.logDebug("Video PLAYING");
        break;

      case YT.PlayerState.PAUSED:
        this.logDebug("Video PAUSED");
        break;

      case YT.PlayerState.BUFFERING:
        this.logDebug("Video BUFFERING");
        break;

      case YT.PlayerState.CUED:
        this.logDebug("Video CUED");
        break;

      default:
        this.logDebug("Video unknown state chage");
    }

    this.didUpdateNodeIfInitialized();
  }

  /**
   * @description Handles the end of the video playback.
   * @param {Object} event - The end event.
   */
  onPlayerEnd (/*event*/) {
    if (this.shouldRepeat()) {
      this.player().playVideo();
    } else {
      this.resolvePlayPromise();
    }
  }

  /**
   * @description Resolves the play promise.
   * @returns {YouTubeAudioPlayer} The player instance.
   */
  resolvePlayPromise () {
    if (this.playPromise()) {
      this.playPromise().callResolveFunc();
      this.setPlayPromise(null);
    }
    return this;
  }

  /**
   * @description Handles changes to the mute state.
   * @param {boolean} oldValue - The old mute value.
   * @param {boolean} newValue - The new mute value.
   */
  didUpdateMute (/*oldValue, newValue*/) {
    if (this.mute()) {
      this.stop();
    } 
  }

  /**
   * @async
   * @description Sets the volume of the player.
   * @param {number} v - The volume value (0.0 to 1.0).
   * @returns {Promise<YouTubeAudioPlayer>} A promise that resolves with the player instance.
   */

  async setVolume (v) {
    // 0.0 to 1.0
    if (this._volume !== v) {
      assert(v >= 0 && v <= 1.0);
      this._volume = v;
      if (this._playerPromise) {
        await this.promiseUpdateVolume();
      }
    }
    return this;
  }

  async promiseUpdateVolume () {
    await this.playerPromise();
    const v = this.volume() * 100;
    if (this.isReady()) {
      this.player().setVolume(v);
      if(v !== this.player().getVolume()) {
        this.logDebug("WARNING: setVolume not equal getVolume after set");
        this.logDebug("set volume:", v);
        this.logDebug("getVolume: ", this.player().getVolume());
      }
    }
  }

  /**
   * @async
   * @description Stops the YouTube player.
   */
  async stop () {
    if (!this._playerPromise) {
      // no one has asked player to play yet,
      // so we can ignore the stop
      return;
    }
    await this.playerPromise();
    this.player().stopVideo();
    this.resolvePlayPromise();
  }


  /**
   * @description Gets the seconds buffered by the player.
   * @returns {number} The seconds buffered.
   */
  secondsBuffered () {
    if (this.isReady()) {
      const player = this.player();
      const fraction = player.getVideoLoadedFraction(); // Get the fraction of the video that has been loaded
      const duration = player.getDuration(); // Get the total duration of the video
      const bufferedTime = fraction * duration; // Calculate the amount of time that has been buffered

      //console.log("Buffered time: " + bufferedTime + " seconds");
      return Math.round(bufferedTime);
    }
    return 0;
  }

  /**
   * @description Gets the fraction of the video that has been buffered.
   * @returns {number} The fraction buffered.
   */
  fractionBuffered () {
    if (this.isReady()) {
      const player = this.player();
      const fraction = player.getVideoLoadedFraction(); // Get the fraction of the video that has been loaded
      return fraction;
    }
    return 0;
  }

  /**
   * @description Plays the video when sufficient buffering is detected.
   */
  playWhenBuffered () {
    // this is trying to solve the problem of choppy playback by ensuring sufficient buffering
    if (!this._checkBuffer) {
      this._checkBuffer = setInterval(() => {
        if (this.secondsBuffered() > 30) {
          this.player().playVideo();
          clearInterval(this._checkBuffer); // Stop checking the buffer size
          this._checkBuffer = null;
        }
      }, 1000); // Check every second
    }
  }

  // --- actions ---

  /**
   * @description Toggles the play state of the YouTube player.
   * @returns {YouTubeAudioPlayer} The player instance.
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
   * @description Gets the action info for toggling play state.
   * @returns {Object} The action info.
   */
  togglePlayActionInfo () {
    return {
      isEnabled: this.videoId() !== null,
      title: this.isPlaying() ? "Stop" : "Play",
      isVisible: true,
    };
  }

/*
  async shutdown () {
    await this.playerPromise();
    const player = this.player();
    player.stopVideo();
    player.destroy();
    this.setPlayer(null);
    console.log("------------- shutdown YouTubePlayer ---------------");
  }
    */
   
  /**
   * @async
   * @description Shuts down the YouTube player.
   */
  async shutdown () {
    if (this._playerPromise && this.playerPromise().hasAwaiters()) {
      // it's in the middle of being setup so wait until that resolves/rejects
      await this.playerPromise();
    }

    // cleanup player
    const player = this.player();
    if (player) {
      player.stopVideo();
      player.destroy();
      this.setPlayer(null);
    }

    // cleanup element
    const e = this.element();
    if (e) {
      e.parentNode.removeChild(e);
      this.setElement(null);
    }

    this.setPlayerPromise(Promise.clone().setLabel(this.type() + " setup"));
  }

}).initThisClass();
