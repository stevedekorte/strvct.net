"use strict";

/* 
    YouTubePlayerFrame

    A singleton that loads the YouTubeAPI script.

    Use the following before calling the YouTube API to wait for it to load:
    
    await YouTubePlayerFrame.shared().frameReadyPromise();
*/

(class YouTubePlayerFrame extends ProtoClass {

  static initClass () {
    this.setIsSingleton(true);
  }
  
  initPrototypeSlots () {
    {
      const slot = this.newSlot("frameReadyPromise", null);
      slot.setSlotType("Promise");
    }

    this.setIsDebugging(false);
  }

  init () {
    super.init();
    /*
    const p = Promise.clone();
    p.setLabel(this.typeId() + ".frameReadyPromise");
    //p.setOnAwaitFunc(() => { this.setup(); });
    this.setFrameReadyPromise(p);
    */
  }

  frameReadyPromise () {
    if (!this._frameReadyPromise) {
      this.setFrameReadyPromise(Promise.clone().setLabel(this.typeId() + ".frameReadyPromise"));
      this.setup();
    }
    return this._frameReadyPromise;
  }

  setup () {
      // Load the YouTube IFrame Player API asynchronously
      this.debugLog("setup()");
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  onLoaded () {
    this.debugLog("onLoaded()");
    this.frameReadyPromise().callResolveFunc();
  }

}).initThisClass();

getGlobalThis().onYouTubeIframeAPIReady = function (arg1, arg2, arg3) {
  // a global function called after YouTube API code downloads
  YouTubePlayerFrame.shared().onLoaded();
};
