"use strict";

/**
 * @module library.services.YouTube.YouTubeService
 */

/**
 * @class YouTubeService
 * @extends BMStorableNode
 * @classdesc YouTubeService class for managing YouTube-related functionality.
 */
(class YouTubeService extends BMStorableNode {
  /**
   * @description Initializes the prototype slots for the YouTubeService.
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
   */
  init() {
    super.init();
    this.setTitle("YouTube");
    this.setSubtitle("music service");
  }

}).initThisClass();