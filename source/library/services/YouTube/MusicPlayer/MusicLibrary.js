"use strict";

/**
 * @module library.services.YouTube.MusicPlayer
 * @class MusicLibrary
 * @extends SvSummaryNode
 * @description A music library.
 * All tracks are under a Creative Commons License.
 */

(class MusicLibrary extends SvSummaryNode {

    initPrototypeSlots () {

        /**
     * @member {String} currentTrack
     * @description The current track.
     */
        {
            const slot = this.newSlot("currentTrack", null);
            slot.setInspectorPath("");
            //slot.setLabel("mute")
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            //slot.setIsSubnodeField(true)
            slot.setCanEditInspection(true);
        }

        /**
     * @member {Object} playlistDicts
     * @description The playlist dictionaries loaded from JSON.
     */
        {
            const slot = this.newSlot("playlistDicts", null);
            slot.setInspectorPath("");
            slot.setLabel("Playlist Dictionaries");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("JSON Object");
            slot.setDuplicateOp("duplicate");
        }

        /**
     * @member {MusicFolder} folder
     * @description The folder.
     */
        {
            const slot = this.newSlot("folder", null);
            slot.setInspectorPath("");
            slot.setLabel("Folder");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setFinalInitProto(MusicFolder);
            slot.setIsSubnode(true);
            slot.setSlotType("MusicFolder");

        }

        /**
     * @member {YouTubeAudioPlayer} musicPlayer
     * @description The music player.
     */
        {
            const slot = this.newSlot("musicPlayer", null);
            slot.setInspectorPath("");
            slot.setLabel("Music Player");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnode(true);
            slot.setSlotType("YouTubeAudioPlayer");
        }

        /**
     * @member {YouTubeAudioPlayer} soundEffectPlayer
     * @description The sound effect player.
     */
        {
            const slot = this.newSlot("soundEffectPlayer", null);
            slot.setInspectorPath("");
            slot.setLabel("Sound Effect Player");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnode(true);
            slot.setSlotType("YouTubeAudioPlayer");
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([MusicFolder]);

        this.setNodeCanAddSubnode(true);
        this.setTitle("Music Library");
        //this.setIsDebugging(true);

    }

    finalInit () {
        super.finalInit();
        this.folder().setName("Playlists");
    }

    hasLoadedPlaylists () {
        return this.playlistDicts() !== null;
    }

    playlistDicts () {
        if (!this._playlistDicts) {
            this.setupPlaylists();
        }
        return this._playlistDicts;
    }

    /**
   * @description Sets up the playlists.
   * @returns {MusicLibrary} The music library.
   */
    setupPlaylists () {
        if (this._hasAttemptedToLoadPlaylists) {
            throw new Error("playlists already attempted to load");
        }
        this._hasAttemptedToLoadPlaylists = true;
        this.loadPlaylistsFromJson();
        const playlistDicts = this._playlistDicts;

        const playlistNames = Object.keys(playlistDicts || {});
        playlistNames.forEach((name) => {
            const playlist = MusicFolder.clone();
            playlist.setName(name);
            this.folder().addSubnode(playlist);
            playlist.setJson(playlistDicts[name]);
        });
        return this;
    }

    /**
   * @description Loads the playlists from JSON.
   * @returns {MusicLibrary} The music library.
   */
    loadPlaylistsFromJson () {
        const resourceFile = SvFileResources.shared().rootFolder().resourceWithName("music-playlists.json");
        assert(resourceFile, "no resource file found for music-playlists.json");

        //const resourceFolder = SvFileResources.shared().rootFolder().resourceAtPath("app/resources/json/music");
        //const resourceFile = resourceFolder.fileWithName("playlists.json");
        assert(resourceFile, "no resource file found for music-playlists.json");
        assert(resourceFile.hasData(), "no data found for music-playlists.json");
        this.setPlaylistDicts(resourceFile.value());
        return this;
    }

    /**
   * @description Returns the music player.
   * @returns {YouTubeAudioPlayer} The music player.
   */
    musicPlayer () {
        if (!this._musicPlayer) {
            const p = YouTubeAudioPlayer.clone();
            p.setTitle("Music Player");
            p.setVolume(0.1);
            this._musicPlayer = p;
        }
        return this._musicPlayer;
    }

    /**
   * @description Returns the sound effect player.
   * @returns {YouTubeAudioPlayer} The sound effect player.
   */
    soundEffectPlayer () {
        if (!this._soundEffectPlayer) {
            const p = YouTubeAudioPlayer.clone();
            p.setTitle("Sound Effect Player");
            p.setVolume(0.5);
            this._soundEffectPlayer = p;
        }
        return this._soundEffectPlayer;
    }

    /**
   * @description Shuts down the music player and sound effect player.
   * @returns {MusicLibrary} The music library.
   */
    shutdown () {
        if (this._musicPlayer) {
            this._musicPlayer.shutdown();
            this.setMusicPlayer(null);
        }

        if (this._soundEffectPlayer) {
            this._soundEffectPlayer.shutdown();
            this.setSoundEffectPlayer(null);
        }

        return this;
    }


    /**
   * @description Returns the playlist with the given name.
   * @param {String} name - The name of the playlist.
   * @returns {MusicFolder} The playlist.
   */
    playlistWithName (name) {
        const match = this.folder().firstSubnodeWithTitle(name);
        assert(match);
        return match;
    }

    /**
   * @description Returns the playlists.
   * @returns {Array} The playlists.
   */
    playlists () {
        return this.folder().subnodes();
    }

    /**
   * @description Returns the track with the given name.
   * @param {String} name - The name of the track.
   * @returns {MusicTrack} The track.
   */
    trackWithName (name) {
        const track = this.playlists().detectAndReturnValue(playlist => {
            return playlist.trackWithName(name);
        });
        return track;
    }

    /**
   * @description Plays the track with the given name.
   * @param {String} name - The name of the track.
   * @returns {MusicLibrary} The music library.
   */
    playTrackWithName (name) {

        this.logDebug("playTrackWithName('" + name + "')");
        const track = this.trackWithName(name);
        if (!track) {
            console.warn(this.svType() + " couldn't find track '" + name + "'");
            return;
        }
        const player = this.musicPlayer();
        player.setTrackName(track.name());
        player.setVideoId(track.trackId());
        player.setShouldRepeat(true);
        player.play();
    }

    /**
   * @description Returns the tracks for the playlists with the given names.
   * @param {Array} playlistNames - The names of the playlists.
   * @returns {Array} The tracks.
   */
    tracksForPlaylistsWithNames (playlistNames) {
        assert(this.hasLoadedPlaylists(), "playlists not loaded");
        const playlists = playlistNames.map(pName => this.playlistWithName(pName));
        return playlists.map(playlist => playlist.tracks()).flat();
    }

    /**
   * @async
   * @description Plays the sound effect with the given name.
   * @param {String} name - The name of the sound effect.
   * @returns {MusicLibrary} The music library.
   */
    async playSoundEffectWithName (name) {
        const track = this.trackWithName(name);
        if (!track) {
            console.warn(this.svType() + " couldn't find track '" + name + "'");
            return;
        }
        const player = this.soundEffectPlayer();
        player.setTrackName(track.name());
        player.setVideoId(track.trackId());
        player.setShouldRepeat(false);
        await player.play();
    }


}).initThisClass();
