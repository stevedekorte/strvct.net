"use strict";

/* 
    Music


*/

(class MusicPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("tracksMap", null);
    this.newSlot("currentTrack", null);
    this.newSlot("isMuted", false);
  }

  init() {
    super.init();
    this.setTracksMap(new Map());
    this.selectPlaylistWithName("DnD");
    this.setIsDebugging(true);
  }

  trackNames() {
    return this.tracksMap().keysArray();
  }

  selectPlaylistWithName(name) {
    this.selectPlaylistsWithNames([name]);
    return this;
  }

  selectPlaylistsWithNames(names) {
    this.tracksMap().clear();
    names.forEach((name) => {
      const playlistMap = MusicLibrary.shared().playlistWithName(name);
      playlistMap.forEachKV((k, v) => {
        this.tracksMap().set(k, v);
      });
    });
    return this;
  }

  playTrackWithName(name) {
    this.debugLog("playTrackWithName('" + name + "')");
    this.playTrackId(this.trackIdForName(name));
  }

  trackIdForName (name) {
    return this.tracksMap().get(name);
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
