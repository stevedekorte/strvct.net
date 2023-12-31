"use strict";

/* 

  YouTubePlaylist


*/


(class YouTubePlaylist extends BMSummaryNode {

  initPrototypeSlots() {
    {
      const slot = this.newSlot("name", null);
      slot.setLabel("name");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  init() {
    super.init();
  }

  finalInit () {   
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
    this.setSubnodeClasses([YouTubeTrack]);
    this.setCanAdd(true);
    this.setCanDelete(true);
    super.finalInit()
  }

  title () {
    return this.name();
  }

  setJson (json) {
    // json should be an dict of trackName:trackId entries

    Object.keys(json).forEach(trackName => {
      const trackId = json[trackName];
      this.newTrack().setName(trackName).setTrackId(trackId);
    })
  }

  newTrack () {
    return this.add();
  }

}).initThisClass();
