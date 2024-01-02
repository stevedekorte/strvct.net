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
      const slot = this.newSlot("shouldPlayOnAccess", true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
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
    return this.trackId();
  }

  prepareToAccess () {
    super.prepareToAccess();
    if (this.shouldPlayOnAccess()) {
      this.play();
    }
  }

  async play () {
    const player = YouTubeAudioPlayer.shared();
    player.setTrackName(this.name());
    player.setVideoId(this.trackId());
    const isSoundFX = this.name().includes("FX");
    player.setShouldRepeat(!isSoundFX);
    await player.play();
  }

}).initThisClass();
