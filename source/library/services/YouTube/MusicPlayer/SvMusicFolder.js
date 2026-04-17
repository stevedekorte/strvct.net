/**
 * @module library.services.YouTube.MusicPlayer
 */

"use strict";

/**
 * @class SvMusicFolder
 * @extends SvSummaryNode
 * @classdesc Represents a folder for organizing music tracks.
 */
(class SvMusicFolder extends SvSummaryNode {

    /**
   * Initializes the prototype slots for the SvMusicFolder class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {string} name - The name of the music folder.
     * @category Properties
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
        this.setSubnodeClasses([SvMusicTrack, SvMusicFolder]);
        this.setNodeCanAddSubnode(true);
        this.setCanDelete(true);
        this.setNoteIsSubnodeCount(true);
    }

    /**
   * Performs final initialization for the SvMusicFolder.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.makeSortSubnodesByTitle();
    }

    /**
   * Returns the title of the music folder.
   * @returns {string} The name of the music folder.
   * @category Getters
   */
    title () {
        return this.name();
    }

    /**
   * Sets the JSON data for the music folder.
   * @param {Object} json - An object containing trackName:trackId entries.
   * @category Data Management
   */
    setJson (json) {
        // json should be an dict of trackName:trackId entries

        Object.keys(json).forEach(trackName => {
            const trackId = json[trackName];
            this.newTrack().setName(trackName).setTrackId(trackId);
        });
    }

    /**
   * Creates a new track and adds it to the folder.
   * @returns {SvMusicTrack} The newly created track.
   * @category Track Management
   */
    newTrack () {
        const track = SvMusicTrack.clone();
        this.addSubnode(track);
        return track;
    }

    /**
   * Returns all subfolders within this folder.
   * @returns {Array} An array of SvMusicFolder instances.
   * @category Folder Management
   */
    folders () {
        return this.subnodes().select(sn => sn.thisClass().isKindOf(SvMusicFolder));
    }

    /**
   * Returns all tracks within this folder.
   * @returns {Array} An array of SvMusicTrack instances.
   * @category Track Management
   */
    tracks () {
        return this.subnodes().select(sn => sn.thisClass().isKindOf(SvMusicTrack));
    }

    /**
   * Returns the names of all tracks in this folder.
   * @returns {Array} An array of track names.
   * @category Track Management
   */
    trackNames () {
        return this.tracks().map(sn => sn.name());
    }

    /**
   * Finds a track by its name within this folder or its subfolders.
   * @param {string} name - The name of the track to find.
   * @returns {SvMusicTrack|null} The found track or null if not found.
   * @category Track Management
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
   * @returns {SvMusicFolder} The current instance.
   * @category Folder Management
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
