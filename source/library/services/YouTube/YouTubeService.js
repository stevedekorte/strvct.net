"use strict";

/* 
    YouTubeService

*/

(class YouTubeService extends BMStorableNode {
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

  init() {
    super.init();
    this.setTitle("YouTube");
    this.setSubtitle("music service");
  }

}).initThisClass();
