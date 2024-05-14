"use strict";

/* 

  MusicTrack


*/




(class MusicTrack extends BMSummaryNode {

  initPrototypeSlots() {
    {
      const slot = this.newSlot("name", "unnamed");
      slot.setLabel("name");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    {
      const slot = this.newSlot("trackId", null);
      slot.setInspectorPath("");
      slot.setLabel("id");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
      //slot.setCanEditInspection(true);
    }

    /*
    {
      const slot = this.newSlot("service", "YouTube");
      slot.setInspectorPath("");
      slot.setLabel("service");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }
    */

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

    {
      const slot = this.newSlot("shouldPlayOnAccess", true);
    }

    /*

      // optional info
      {
        const slot = this.newSlot("label", null);
        slot.setShouldJsonArchive(true);
      }

      {
        const slot = this.newSlot("transcript", null);
        slot.setShouldJsonArchive(true);
      }

    */

    {
      const slot = this.newSlot("isPlaying", false);
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("delegateSet", null);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setDelegateSet(new Set());
    //this.setIsDebugging(true);
  }

  finalInit () {   
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
    super.finalInit();
  }

  title () {
    return this.name();
  }

  subtitle () {
    return this.isPlaying() ? "playing" : "";
  }

    /*

  prepareToAccess () {
    super.prepareToAccess();
    if (this.shouldPlayOnAccess()) {
      this.play();
    }
  }
  */

  library () {
    return this.firstParentChainNodeOfClass(MusicLibrary)
  }

  folder () {
    return this.firstParentChainNodeOfClass(MusicFolder)
  }

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

  async stop () {
    const player = this.library().musicPlayer()
    await player.stop();
    this.setIsPlaying(false);

    this.post("onSoundEnded");
  }

  isMusicTrack () {
    return true;
  }

  // --- play action ---

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

  // --- delegates --- 

  post (methodName) {
    this.postNoteNamed(methodName);
    this.sendDelegate(methodName);
    return this;
  }

  addDelegate (d) {
      this.delegateSet().add(d);
      return this;
  }

  removeDelegate (d) {
      this.delegateSet().delete(d);
      return this;
  }

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
