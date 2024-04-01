"use strict";

/* 
    YouTubeAudioPlayer


    One shot use example:

      const player = YouTubeAudioPlayer.clone();
      player.setTrackName(this.name());
      player.setVideoId(this.trackId());
      player.setShouldRepeat(false);
      await player.play();
      await player.shutdown();

*/

(class YouTubeAudioPlayer extends BMStorableNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("element", null);
      slot.setSyncsToView(true);
    }
    
    { 
      const slot = this.newSlot("playerPromise", null); // resolves once player is available
    }

    {
      const slot = this.newSlot("playPromise", null);
    }

    {
      const slot = this.newSlot("player", null); // reference to store the YouTube player
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("stateName", "");
      slot.setInspectorPath("");
      slot.setLabel("status");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

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

    {
      const slot = this.newSlot("volume", 0.05);
      slot.setInspectorPath("");
      //slot.setLabel("");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setAllowsMultiplePicks(false);
      slot.setValidValues(this.validVolumeValues());
    }

    {
      const slot = this.newSlot("togglePlayAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Play");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("togglePlay");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setIsDebugging(false);
  }

  playerPromise () {
    if (!this._playerPromise) {
      this._playerPromise = Promise.clone().setLabel(this.type() + " setup");
      this.setupFrame();
    }
    return this._playerPromise
  }

  finalInit () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    
    super.finalInit();
    this.setTitle("YouTube Audio Player");
  }

  subtitle () {
    if (this.isPlaying()) {
      const lines = []
      lines.push(this.stateName() + " '" + this.trackName() + "'");
      /*
      const secs = this.secondsBuffered();
      if (secs) {
        const percentBufferred = Math.round(this.fractionBuffered()*100) + "%";
        lines.push(percentBufferred + " buffered (" + secs + "s)");
        //lines.push(secs + "s buffered");
      }
      */
      lines.push("volume: " + Math.round(this.volume()*100) + "%");
      return lines.join("\n");
    }
    return ""
  }

  validVolumeValues () {
    const values = [];
    let v = 0;
    while (v <= 1.0) {
      values.push(v);
      //values.push({ label: (v*100) + "%", value: v });
      v += 0.05;
      v = Math.round(v*100)/100;
    }
    return values;
  }

  async setupFrame () {
    await EventManager.shared().firstUserEventPromise();
    await YouTubePlayerFrame.shared().frameReadyPromise();
    //this.playerPromise().beginTimeout(3000);
    this.setupPlayer();
  }

  setupPlayer () {
    console.log("------------- setup YouTubePlayer ---------------");
    //debugger;
    this.debugLog("setupPlayer()");
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
        autoplay: 1, // Auto-play the video
        controls: 0, // Hide player controls
        showinfo: 0, // Hide video information
        rel: 0, // Do not show related videos
        modestbranding: 1, // Show minimal YouTube branding
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

  async play () {
    if (!this.videoId()) {
      return;
    }

    await this.playerPromise();
    this.debugLog("play() after promise");

    const startSeconds = 0.0;
    if (this.videoId()) {
      //this.stop(); // if we do this, the next video only gets cued but not played. Why?
      this.resolvePlayPromise();

      this.setPlayPromise(Promise.clone().setLabel(this.type() + ".playPromise"));
      this.player().loadVideoById(this.videoId(), startSeconds);
      //this.player().pauseVideo()
      //this.player().cueVideoById(this.videoId());
      //this.playWhenBuffered();
      return this.playPromise();
    }
  }

  isReady () {
    if (this._playerPromise) {
      return this.playerPromise().isResolved();
    }
    return false;
  }

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

  stateName () {
    if (this.isReady()) {
      const k = String(this.player().getPlayerState());
      assert(this.statesMap().has(k));
      return this.statesMap().get(k);
    }
    return "unitialized";
  }

  isPlaying () {
    if (this.isReady()) {
      const currentState = this.player().getPlayerState();
      //const playStates = [YT.PlayerState.CUED, YT.PlayerState.BUFFERING, YT.PlayerState.PLAYING];
      const playStates = [YT.PlayerState.BUFFERING, YT.PlayerState.PLAYING];
      return playStates.includes(currentState);

    }
    return false;
  }

  onPlayerError (event) {
    debugger;
    // Handle the error based on the error code
    const error = Number(event.data);
    this.debugLog(
      "------------------ onPlayerError " +
        error +
        " videoId: '" +
        this.videoId() +
        "'"
    );

    switch (error) {
      case 2: // Invalid parameter
        console.error(
          "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks."
        );
        break;
      case 5:
        console.error(
          "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred."
        );
        break;
      case 100: // Video not found
        console.error("Video not found.");
        break;
      case 101: // Playback not allowed
        console.error(
          "The owner of the requested video does not allow it to be played in embedded players."
        );
        break;
      case 150: // Playback not allowed
        console.error(
          "The owner of the requested video does not allow it to be played in embedded players."
        );
        break;
      default: // Unexpected error
        console.error("An unexpected error occurred while loading the video.");
    }
  }

  onPlayerReady (event) {
    this.debugLog("onPlayerReady()");
    this.updateVolume();

    assert(this._playerPromise);
    this.playerPromise().callResolveFunc();
    //this.player().style.display = "none";
  }

  onPlayerStateChange (event) {
    this.debugLog("onPlayerStateChange " + event.data);

    const state = Number(event.data);
    switch (state) {
      case -1:
        this.debugLog("Video unstarted");
        break;

      case YT.PlayerState.ENDED:
        this.debugLog("Video ENDED");
        this.onPlayerEnd(event);
        break;

      case YT.PlayerState.PLAYING:
        this.debugLog("Video PLAYING");
        break;

      case YT.PlayerState.PAUSED:
        this.debugLog("Video PAUSED");
        break;

      case YT.PlayerState.BUFFERING:
        this.debugLog("Video BUFFERING");
        break;

      case YT.PlayerState.CUED:
        this.debugLog("Video CUED");
        break;

      default:
        this.debugLog("Video unknown state chage");
    }

    this.didUpdateNodeIfInitialized();
  }

  onPlayerEnd (event) {
    if (this.shouldRepeat()) {
      this.player().playVideo(); // Replay the video when it ends
    } else {
      this.resolvePlayPromise();
    }
  }

  resolvePlayPromise () {
    if (this.playPromise()) {
      this.playPromise().callResolveFunc();
      this.setPlayPromise(null);
    }
    return this;
  }

  async setVolume (v) {
    // 0.0 to 1.0
    if (this._volume !== v) {
      assert(v >= 0 && v <= 1.0);
      this._volume = v;
      if (this._playerPromise) {
        this.updateVolume();
      }
    }
    return this;
  }

  async updateVolume () {
    await this.playerPromise();
    const v = this.volume() * 100;
    if (this.isReady()) {
      this.player().setVolume(v);
      if(v !== this.player().getVolume()) {
        this.debugLog("WARNING: setVolume not equal getVolume after set");
        this.debugLog("set volume:", v);
        this.debugLog("getVolume: ", this.player().getVolume());
      }
    }
  }

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

  async shutdown () {
    await this.playerPromise();
    const player = this.player();
    player.stopVideo();
    player.destroy();
    this.setPlayer(null);
  }

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

  fractionBuffered () {
    if (this.isReady()) {
      const player = this.player();
      const fraction = player.getVideoLoadedFraction(); // Get the fraction of the video that has been loaded
      return fraction;
    }
    return 0;
  }

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

  togglePlay () {
    if (this.isPlaying()) {
      this.stop();
    } else {
      this.play();
    }
    return this;
  }

  togglePlayActionInfo () {
    return {
      isEnabled: true,
      title: this.isPlaying() ? "Stop" : "Play",
      isVisible: true,
    };
  }

  async shutdown () {
    if (this.playerPromise().hasAwaiters()) {
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
