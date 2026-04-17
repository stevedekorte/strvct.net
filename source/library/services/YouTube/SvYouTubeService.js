"use strict";

/**
 * @module library.services.YouTube
 */

/**
 * @class SvYouTubeService
 * @extends SvStorableNode
 * @classdesc SvYouTubeService class for managing YouTube-related functionality.
 */
(class SvYouTubeService extends SvStorableNode {
    /**
   * @description Initializes the prototype slots for the SvYouTubeService.
   * @category Initialization
   */
    initPrototypeSlots () {
    /*
    {
      const slot = this.newSlot("musicLibrary", null)
      slot.setShouldStoreSlot(true);
      slot.setFinalInitProto(SvMusicLibrary);
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
     * @member {SvYouTubeAudioPlayer} youTubeAudioPlayer - The YouTube audio player instance.
     * @category Audio
     */
        {
            const slot = this.newSlot("youTubeAudioPlayer", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SvYouTubeAudioPlayer);
            slot.setIsSubnode(true);
            slot.setSlotType("SvYouTubeAudioPlayer");
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
   * @description Initializes the SvYouTubeService instance.
   * @category Initialization
   */
    init () {
        super.init();
        this.setTitle("YouTube");
        this.setSubtitle("music service");
    }

}).initThisClass();
