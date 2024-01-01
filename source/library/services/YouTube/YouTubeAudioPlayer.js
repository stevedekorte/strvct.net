"use strict";

/* 
    YouTubeAudioPlayer
*/

(class YouTubeAudioPlayer extends BMStorableNode {

  static initClass () {
    this.setIsSingleton(true)
    return this
  }

  initPrototypeSlots () {

    {
      const slot = this.newSlot("element", null);
    }
    
    { 
      const slot = this.newSlot("playerPromise", null); // resolves once player is available
    }

    {
      const slot = this.newSlot("player", null); // to store the YouTube player
    }

    {
      const slot = this.newSlot("isReady", false);
    }

    {
      const slot = this.newSlot("videoId", null);      
      slot.setInspectorPath("")
      slot.setLabel("video ID")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("shouldRepeat", true);      
      slot.setInspectorPath("")
      slot.setLabel("repeat")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("frameIsReady", null);
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

    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init();
    this.setIsDebugging(true);
    this.setPlayerPromise(Promise.clone());
    this.setupFrame();
  }

  finalInit () {
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
    
    super.finalInit()
    this.setTitle("YouTube Audio Player")
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
    this.loadFrameAPI(); // this will call setupPlayer after frame is loaded
  }

  loadFrameAPI () {
    this.debugLog("loadFrameAPI()");
    // Load the YouTube IFrame Player API asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    return this;
  }

  onFrameReady () {
    this.debugLog("onFrameReady()");
    this.setFrameIsReady(true);
    this.setupPlayer();
    return this;
  }

  setupPlayer () {
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
      e.id = "youTubePlayer";
      e.style.display = "none";
      document.body.appendChild(e);
      const player = new YT.Player(e.id, json);
      assert(player);
      this.setPlayer(player);
    } catch (error) {
      console.warn(error);
      throw error;
    }
    this.setIsReady(false);
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
      this.player().loadVideoById(this.videoId(), startSeconds);
      //this.player().pauseVideo()
      //this.player().cueVideoById(this.videoId());
      //this.playWhenBuffered();
    }
  }

  isPlaying () {
    if (this.isReady()) {
      return this.player().getPlayerState() === YT.PlayerState;
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
    assert(!this.isReady());
    this.setIsReady(true);
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
  }

  onPlayerEnd (event) {
    if (this.shouldRepeat()) {
      this.player().playVideo(); // Replay the video when it ends
    }
  }

  async setVolume (v) {
    // 0.0 to 1.0
    await this.playerPromise();
    assert(v >= 0 && v <= 1.0);
    this._volume = v;
    this.updateVolume();
    return this;
  }

  async updateVolume () {
    await this.playerPromise();
    const v = this.volume() * 100;
    if (this.isReady()) {
      this.debugLog("set volume:", v);
      this.player().setVolume(v);
      this.debugLog("getVolume: ", this.player().getVolume());
      //assert(v === this.player().getVolume());
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
      var fraction = player.getVideoLoadedFraction(); // Get the fraction of the video that has been loaded
      var duration = player.getDuration(); // Get the total duration of the video
      var bufferedTime = fraction * duration; // Calculate the amount of time that has been buffered

      console.log("Buffered time: " + bufferedTime + " seconds");
      return this;
    }
    return 0;
  }

  playWhenBuffered () {
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


}).initThisClass();

getGlobalThis().onYouTubeIframeAPIReady = function () {
  // called after API code downloads
  YouTubeAudioPlayer.shared().onFrameReady();
}

//YouTubeAudioPlayer.shared() // get the iframe and player setup
