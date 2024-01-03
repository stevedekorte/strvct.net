"use strict";

/* 

  MusicFolder


*/


(class MusicFolder extends BMSummaryNode {

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
    super.finalInit();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([MusicTrack, MusicFolder]);
    this.setCanAdd(true);
    this.setCanDelete(true);
    this.setNoteIsSubnodeCount(true);
    this.makeSortSubnodesByTitle();
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
    const track = MusicTrack.clone();
    this.addSubnode(track);
    return track;
  }

  folders () {
    return this.subnodes().select(sn => sn.thisClass().isKindOf(MusicFolder));
  }

  tracks () {
    return this.subnodes().select(sn => sn.thisClass().isKindOf(MusicTrack));
  }

  trackNames () {
    return this.tracks().map(sn => sn.name());
  }

  trackWithName (name) {
    let track = this.tracks().detect(track => track.name() === name);
    if (!track) {
      track = this.folders().detectAndReturnValue(folder => folder.trackWithName(name));
    }
    return track;
  }

  clear () {
    this.removeAllSubnodes();
    return this;
  }

  /*
  copyMergeTracks (tracks) {
    tracks.forEach(track => {
      if (!this.trackWithName(track.name())) {
        this.newTrack().setName(track.name()).setTrackId(track.trackId());
      }
    })
  }
  */

}).initThisClass();
