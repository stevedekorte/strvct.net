/**
 * @module library.services.YouTube
 */

"use strict";

/**
 * @class YouTubePlayerFrame
 * @extends ProtoClass
 * @classdesc A singleton that loads the YouTubeAPI script.
 * Use the following before calling the YouTube API to wait for it to load:
 * await YouTubePlayerFrame.shared().frameReadyPromise();
 */
(class YouTubePlayerFrame extends ProtoClass {

  /**
   * @static
   * @description Initializes the class as a singleton.
   * @category Initialization
   */
  static initClass () {
    this.setIsSingleton(true);
  }
  
  /**
   * @description Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Promise} frameReadyPromise
     * @category State
     */
    {
      const slot = this.newSlot("frameReadyPromise", null);
      slot.setSlotType("Promise");
    }

    this.setIsDebugging(false);
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
    /*
    const p = Promise.clone();
    p.setLabel(this.svTypeId() + ".frameReadyPromise");
    //p.setOnAwaitFunc(() => { this.setup(); });
    this.setFrameReadyPromise(p);
    */
  }

  /**
   * @description Returns the frame ready promise, creating it if it doesn't exist.
   * @returns {Promise}
   * @category State
   */
  frameReadyPromise () {
    if (!this._frameReadyPromise) {
      this.setFrameReadyPromise(Promise.clone().setLabel(this.svTypeId() + ".frameReadyPromise"));
      this.setup();
    }
    return this._frameReadyPromise;
  }

  /**
   * @description Sets up the YouTube IFrame Player API.
   * @private
   * @category Setup
   */
  setup () {
      // Load the YouTube IFrame Player API asynchronously
      this.logDebug("setup()");
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  /**
   * @description Called when the YouTube API is loaded.
   * @private
   * @category Callback
   */
  onLoaded () {
    this.logDebug("onLoaded()");
    this.frameReadyPromise().callResolveFunc();
  }

}).initThisClass();

/**
 * @global
 * @function onYouTubeIframeAPIReady
 * @description A global function called after YouTube API code downloads.
 * @param {*} arg1
 * @param {*} arg2
 * @param {*} arg3
 * @category Callback
 */
SvGlobals.globals().onYouTubeIframeAPIReady = function (arg1, arg2, arg3) {
  YouTubePlayerFrame.shared().onLoaded();
};