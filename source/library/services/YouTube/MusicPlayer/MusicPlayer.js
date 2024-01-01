"use strict";

/* 
    Music

    Use:

    MusicPlayer.shared().selectPlaylistsWithNames(playlistNames);
    ...
    MusicPlayer.shared().playTrackWithName(aName);

*/

(class MusicPlayer extends BMStorableNode {

  initPrototypeSlots() {

    {
      const slot = this.newSlot("currentTrack", null);
    }

    {
      const slot = this.newSlot("isMuted", false);
      slot.setInspectorPath("")
      slot.setLabel("mute")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("playlist", null);
      slot.setInspectorPath("")
      slot.setLabel("playlist")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setFinalInitProto(MusicPlaylist);    
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  finalInit () {
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
    super.finalInit()
    this.setTitle("Music Player")
    this.playlist().setName("playlist");
    this.selectPlaylistWithName("Fantasy");
  }

  trackNames () {
    return this.playlist().trackNames();
  }

  selectPlaylistWithName (name) {
    this.selectPlaylistsWithNames([name]);
    return this;
  }

  selectPlaylistsWithNames (names) {
    this.playlist().clear();
    const musicLibrary = App.shared().services().youtubeService().musicLibrary();
    names.forEach((name) => {
      const libraryPlaylist = MusicLibrary.shared().playlistWithName(name);
      this.playlist().copyMergeTracks(libraryPlaylist.tracks());
    });
    return this;
  }

  playTrackWithName (name) {
    this.debugLog("playTrackWithName('" + name + "')");
    this.playTrackId(this.trackIdForName(name));
  }

  trackIdForName (name) {
    return this.playlist().trackWithName(name).trackId();
  }

  playTrackId (vid) {
    this.setCurrentTrack(vid);

    if (!vid) {
      this.debugLog("missing track with name '" + name + "'");
      return;
    }

    if (this.isMuted()) {
      this.debugLog("playTrackWithName('" + name + "') - muted so will not play");
      return;
    }
    
    this.debugLog("playTrackId('" + vid + "')");

    if (vid) {
      const yt = YouTubeAudioPlayer.shared();
      if (vid !== yt.videoId() || !yt.isPlaying()) {
        yt.setVideoId(vid).play();
      }
    }
  }

  setIsMuted (aBool) {
    this._isMuted = aBool;
    if (aBool) {
      YouTubeAudioPlayer.shared().stop();
    } else {
      YouTubeAudioPlayer.shared().play();
    }
    return this;
  }

}).initThisClass();
