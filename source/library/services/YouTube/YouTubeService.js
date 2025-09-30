"use strict";

/**
 * @module library.services.YouTube
 */

/**
 * @class YouTubeService
 * @extends SvStorableNode
 * @classdesc YouTubeService class for managing YouTube-related functionality.
 */
(class YouTubeService extends SvStorableNode {
  /**
   * @description Initializes the prototype slots for the YouTubeService.
   * @category Initialization
   */
  initPrototypeSlots () {
    /*
    {
      const slot = this.newSlot("musicLibrary", null)
      slot.setShouldStoreSlot(true);
      slot.setFinalInitProto(MusicLibrary);
      slot.setIsSubnode(true);
    }

    {
        const slot = this.newSlot("musicPlayer", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(MusicPlayer);
        slot.setIsSubnode(true);
    }
    */

    /**
     * @member {YouTubeAudioPlayer} youTubeAudioPlayer - The YouTube audio player instance.
     * @category Audio
     */
    {
        const slot = this.newSlot("youTubeAudioPlayer", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(YouTubeAudioPlayer);
        slot.setIsSubnode(true);
        slot.setSlotType("YouTubeAudioPlayer");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the YouTubeService instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setTitle("YouTube");
    this.setSubtitle("music service");
  }

}).initThisClass();