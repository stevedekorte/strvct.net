/**
 * @module library.services.YouTube.MusicPlayer
 */

"use strict";

/**
 * @class MusicFolder
 * @extends BMSummaryNode
 * @classdesc Represents a folder for organizing music tracks.
 */
(class MusicFolder extends BMSummaryNode {

  /**
   * Initializes the prototype slots for the MusicFolder class.

   */
  initPrototypeSlots () {
    /**
     * @member {string} name - The name of the music folder.
     */
    {
      const slot = this.newSlot("name", null);
      slot.setLabel("name");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([MusicTrack, MusicFolder]);
    this.setNodeCanAddSubnode(true);
    this.setCanDelete(true);
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Performs final initialization for the MusicFolder.

   */
  finalInit () {
    super.finalInit();
    this.makeSortSubnodesByTitle();
  }

  /**
   * Returns the title of the music folder.

   * @returns {string} The name of the music folder.
   */
  title () {
    return this.name();
  }

  /**
   * Sets the JSON data for the music folder.

   * @param {Object} json - An object containing trackName:trackId entries.
   */
  setJson (json) {
    // json should be an dict of trackName:trackId entries

    Object.keys(json).forEach(trackName => {
      const trackId = json[trackName];
      this.newTrack().setName(trackName).setTrackId(trackId);
    })
  }

  /**
   * Creates a new track and adds it to the folder.

   * @returns {MusicTrack} The newly created track.
   */
  newTrack () {
    const track = MusicTrack.clone();
    this.addSubnode(track);
    return track;
  }

  /**
   * Returns all subfolders within this folder.

   * @returns {Array} An array of MusicFolder instances.
   */
  folders () {
    return this.subnodes().select(sn => sn.thisClass().isKindOf(MusicFolder));
  }

  /**
   * Returns all tracks within this folder.

   * @returns {Array} An array of MusicTrack instances.
   */
  tracks () {
    return this.subnodes().select(sn => sn.thisClass().isKindOf(MusicTrack));
  }

  /**
   * Returns the names of all tracks in this folder.

   * @returns {Array} An array of track names.
   */
  trackNames () {
    return this.tracks().map(sn => sn.name());
  }

  /**
   * Finds a track by its name within this folder or its subfolders.

   * @param {string} name - The name of the track to find.
   * @returns {MusicTrack|null} The found track or null if not found.
   */
  trackWithName (name) {
    let track = this.tracks().detect(track => track.name() === name);
    if (!track) {
      track = this.folders().detectAndReturnValue(folder => folder.trackWithName(name));
    }
    return track;
  }

  /**
   * Removes all subnodes from the folder.

   * @returns {MusicFolder} The current instance.
   */
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