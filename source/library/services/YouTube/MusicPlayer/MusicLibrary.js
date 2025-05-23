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
     * @member {MusicFolder} folder
     * @description The folder.
     */
    {
      const slot = this.newSlot("folder", null);
      slot.setInspectorPath("");
      slot.setLabel("Folder")
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setFinalInitProto(MusicFolder);
      slot.setIsSubnode(true)
      slot.setSlotType("MusicFolder");

    }

    /**
     * @member {YouTubeAudioPlayer} musicPlayer
     * @description The music player.
     */
    {
      const slot = this.newSlot("musicPlayer", null);
      slot.setInspectorPath("");
      slot.setLabel("Music Player")
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
      slot.setLabel("Sound Effect Player")
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
    this.setupPlaylists();
    this.folder().setName("Playlists");
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
   * @description Sets up the playlists.
   * @returns {MusicLibrary} The music library.
   */
  setupPlaylists () {
    const playlistNames = Object.keys(this.playlistDicts());
    playlistNames.forEach((name) => {
      const playlist = MusicFolder.clone();
      playlist.setName(name);
      this.folder().addSubnode(playlist);
      playlist.setJson(this.playlistDicts()[name]);
    });
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
      return playlist.trackWithName(name)
    });
    return track;
  }

  /**
   * @description Plays the track with the given name.
   * @param {String} name - The name of the track.
   * @returns {MusicLibrary} The music library.
   */
  playTrackWithName (name) {
    //debugger;
    this.debugLog("playTrackWithName('" + name + "')");
    const track = this.trackWithName(name);
    if (!track) {
      console.warn(this.type() + " couldn't find track '" + name + "'");
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
      console.warn(this.type() + " couldn't find track '" + name + "'");
      return;
    }
    const player = this.soundEffectPlayer();
    player.setTrackName(track.name());
    player.setVideoId(track.trackId());
    player.setShouldRepeat(false);
    await player.play();
  }

  /**
   * @description Returns the playlist dictionaries.
   * @returns {Object} The playlist dictionaries.
   */
  playlistDicts () {
    return {
      Fantasy: {
        // from https://www.youtube.com/@TheAmbienceChannel
        "Underground Drill": "V4LMFa1fZGU",
        "Crowded Hall": "PuItqOyTDlk",
        "Jade Conquest": "t6mNGG6g378",
        "Ingvar's Mead": "Os1yu1ZXyUI",
        "Tyrant's March": "rA9nO-De1Zc",
        "Ghost Ship": "1NzLmREZqSY",
        "Through the Underworld": "vFR7QFVCkHs",
        Serenity: "z3UB3yaJee4",
        Courage: "owqcy7sfkE4",
        "They Are Coming": "L_BhK3C-u3g",
        "A Dangerous Quest": "eQFbkmHjx6I",
        "A City in the Distance": "UhyD0m5igv8",
        "Flooding City": "BaWvLbEHt28",
        "Bard College": "JzRclrjcHV8",
        "Orc Horde": "LA_usD5h640",
        "Marid / Water Genie Realms": "7phUzXCPmWc",
        "Dao / Earth Genie Realms": "80IXXagr_B4",
        "Djinn / Air Genie Realms": "ZHB-Yy_4dzU",
        "Mountain Camp": "18KN9L4VIGk",
        "Witch's Hut": "zIY_-M2lPJY",
        "Revolutionary War / 18th Century War": "bfGdYOKBZus",
        "Tropical Coast": "LboMqM5mEFA",
        "Haunted Battlefield": "QGQltGAWAU0",
        "Haunted House / Creepy Cabin": "QVQD9_eB8Qg",
        "Ghostly Procession": "wflzworJizA",
        "Monster Parade": "fXnIDBEa0Qs",
        "Firework Festival": "rkHA54puEhk",
        "Violent Storm": "B7PQv77VmSw",
        "Magical Catacombs": "pOm1dVXSqG0",
        "Viking Ship": "HB_1VXOQbEo",
        "Vampire Castle": "8tMZWESYXAA",
        "Preparing for a Trial": "sSTVlP1v6-M",
        "Royal Palace": "KTH8CuWEOvc",
        "Cursed City - dogs barking, faint conversations, naying of horses": "nI-iFEFCySE",
        "Mechanical Dungeon": "8lZWC0PwaLA",
        Stables: "QZyoM1nXWRo",
        "Scroll Shop, Scribe's Office": "eYKWDUptWA4",
        "Ship Cabin": "iVLpFoo7ToA",
        "Burning Star": "4hLE7zm1yww",
        "Tavern Party": "x3skYa2i6Bg",
        "After a Battle / Empty Battlefield": "JElsb_pLXqg",
        "Collapsing Mine": "ou245Tc6tt4",
        "New Adventure": "5FVpHQJBeKM",
        "Empty Steppe": "345Cf-nsdnI",
        "Horse Carriage Chase": "WSoBRWF-Cw4",
        "Atlantis Underwater City": "T_4VNSHOnGU",
        "Giant's Forge": "PEtel5NTwAQ",
        "Training Ground": "DnmcTBFZRwU",
        "Autumn Night": "8Hr6QEQPhJY",
        "Flagellant Procession": "PdhVCPe3XA4",
        "Greek Maritime City": "dhQPzfmbjJE",
        "Horror from the Deep | Haunted Lighthouse": "_BUlHXNExPM",
        "Will-o'-the-Wisp Swamp": "nSm-RIO-1H8",
        "Eldritch Horror": "HYkhuvqkOdw",
        Watefall: "sJr1JK3149M",
        "Public Whipping / Flogging": "2AsBiBm7YqA",
        "Autumn Forest": "TdBX9cjY2mA",
        "Practice Duel Sparring": "7DVo4NiYyUc",
        "Steppe / Savanna": "gXJM1L1cFpw",
        "Campfire Rest": "A1y09YspJvQ",
        "Bubbling Caldron or Acid Pool": "E-J9oPhdB5k",
        "Pagan Festival": "Z6six5WeZVY",
        Brothel: "_ft7Nk2il_4",
        "Marching Through Rain": "nfK5wGJEjjs",
        "Giant Whirlpool": "3qo2dMkDEJk",
        "Abandoned Village": "FzzZ0Ll7UoA",
        "Peaceful Forest": "4B-tHXtHw_k",
        "Midsummer Festival": "50kEdch_4ao",
        "Coming of Angels": "G2Zmffr4iBU",
        "Water Mill": "l123ewMXptU",
        "Spider Cave": "qP9lmVaBhDI",
        "Inside a Monster": "G7HS6hP21LA",
        "City Gates": "u6q2mjSNuU0",
        "Sunset Forest": "mcuZQFauy0w",
        "Old Library": "1TwQY4dkWv0",
        "Winter War": "PFpAPHbYTWo",
        "Tavern Kitchen": "qJxSYTRxkiQ",
        "Slave Galley": "Rpim1NAFT18",
        "Winter River": "VqJ841bDbGo",
        "Making an Ambience": "K1AuH72oi5I",
        "End of the World": "fDogW8-RL-4",
        "Village Fire": "rVmIsBn_dyI",
        "Nighttime Inn": "-UmkWl4nvsk",
        "Torture Chambers": "lrZA4RoxO_M",
        "Ice Dragon": "7B9W6gFZNS0",
        "Trading Post": "gOyBE-oBicc",
        "Dangerous Forest": "LEs2J01gZX8",
        "Sick Bay": "1QLWFguij-Y",
        "Giant Sand Worm": "NkziO7QkExk",
        "Carriage in a Storm": "8HHtObBH0iE",
        "Cursed Wastes": "Af5-S2o7bcM",
        "Blood War": "Vx0bqo88XG8",
        "Elemental Chaos": "PPQtr5PDaL8",
        Abyss: "aQLvd6h6WTM",
        "Slime Cave": "LZeNKZOXAOo",
        "Avernus [Descent Into Avernus]": "TTyOsAYD-Ng",
        Kraken: "3hEY8hFQ55o",
        Shipwreck: "z4sWBPr4wGM",
        "Jungle Ruins": "f6Ohca45lY4",
        "Garden Pond": "8Ic9-r417gs",
        "Cave City": "nfjrgINw0l4",
        "Clockwork Tower": "RukWUhWekcU",
        "Chariot Battle": "vXqVrspYuLs",
        "Forest City": "4dmPmVywWMw",
        "Giant's Rage": "rJlbizvKSGU",
        "Magic Realm": "-zyK1nv5l5s",
        "Giant Heart": "m3qV0ZvHLXU",
        "Valhalla | Eternal Battle": "3bY-zIGNZxs",
        "Steampunk Airship": "jFCTt0VH2R4",
        "Active Mine": "vnoLRJJJ8BQ",
        "Skeleton Horde": "IgoCbdd7yfY",
        "Lumber Mill": "EZJ4vU5aesc",
        "Ice Blizzard": "YyKW2EmGVO8",
        "Waiting in Ambush": "V7vl9iIZgMI",
        "Filthy Sewers": "7N5D5niaBWQ",
        "Bloody Slaughter": "TUKaKXdam9s",
        "Faerie Forest": "exf2967RCjg",
        "Knight Tournament": "Kws7g5Qqae0",
        "Ghostly Castle": "6A6IRkaNrx4",
        "Amazonian Baths": "DKYvu3hmH2Q",
        Hydra: "CK4X-tNnR1M",
        "Jewelry Workshop": "uWcC1jlbwSA",
        Earthquake: "9ta0_OKYADg",
        "Volcano Eruption": "lxNvXSpvc3s",
        "Orc Gang": "PxalDgmxAFo",
        Underwater: "IaPEdWTPopA",
        "Ship in a Storm": "HoWVCG1H_bg",
        "Lighthouse Fire": "mXbwarVE52U",
        "Treasure Cave": "8jA_Q0oHSrg",
        "Holy Temple": "BTVkNq072UE",
        "Military Encampment": "J-1JR8lU1is",
        "Forest Battle": "thnSlpl5pIU",
        "Burning Forest": "mOMOX0FoKP4",
        "Public Bathhouse": "bPyLzYYugn0",
        "Cozy Home": "V7PpeZzltLI",
        "Empty Tavern": "H01x22_PKok",
        "Dwarven Smithy": "7LqWV3KZcPo",
        "Human Sacrifice": "OKY_wpP-ZAo",
        "Naval Battle": "RoBjokc-s8M",
        "Tavern Bard": "an6-eSSAIM8",
        "Scary Forest": "BkmO28ihl2Y",
        "Fiery Volcano": "kUhDNbBPPhQ",
        "Horse Archer": "gD8o7ShYnXo",
        "Horse Cart": "-bP2oZy9Kjg",
        "Beast Lands": "tZSLkRLreFQ",
        "Sword Duel": "oBsHWwmXbcM",
        "Mayan / Amerindian City": "7sEI8_MW16Q",
        "Banshee's Cry": "PJ7ePH9eVZ0",
        "Harpy Nest": "bXujtcFHcxc",
        "Summer Night": "kSK2iyMS8GY",
        "Dragon's Rampage": "26Byt2pNV4M",
        "Werewolf Forest": "128kAIlwh4g",
        "Giant's Home": "HkCSrnsd2F8",
        "Plague & Disease": "p2tO8lNCRRI",
        "Dark Prison": "gbYGvsTSk9k",
        "Tavern Brawl": "wo1Z8DdOrqA",
        "Pilgrim's Path": "xcdBdAUXo3Y",
        "Tribal Charge": "g-qPRt4IRMo",
        "Stealthy Burglary": "SXYLUuEjbqk",
        "Druid's Cave": "W3Ep_LocbAY",
        "Town Panic": "Sw9yC8rKcAY",
        "World Tree": "J2RiEp-M4Og",
        "Magic Academy": "nd3nIxU3g7Y",
        "Hookah Den": "q5dQT7-Xoh0",
        "Artisan Street": "Hoba6ktJ1NA",
        "Warriors of the Dunes": "6aA1Jh0ohd4",
        "Street Preacher": "glnsdpLN-40",
        "Electric Dragon": "qXAkVD4qvHY",
        "Castle Guard": "J5HWAUgwITg",
        "River Boat": "UxNILOXJVhM",
        "Roman Lavatory": "XgZivLuAnaU",
        "Archer Volleys": "tELTUn9jP5M",
        "Village Barn": "V5l2SxH6RgY",
        "Dragon's Lair": "4BAdhivcV90",
        "Battle Charge": "Bz0Cye__3AQ",
        "Monster Infested Caves": "nNpDCYUaaFg",
        "Desert Winds": "_5SwTjctJ-w",
        "Underground Forge": "gsn1HnI1pCQ",
        "Nesting Cliffs": "9I3ShuKYiFk",
        "Canyon Bridge": "8WrKG28WTVM",
        "Undead Crypt": "QVtwZW7YQik",
        "Monument Construction": "gJpb9I3I1N8",
        "Clock Tower": "6XQZWTfS5CE",
        "Ice City": "6XTV76qBtCs",
        "Desert Canyon": "4ovTEOsPnCk",
        "War Dance": "EQIrzBh1EIk",
        "Royal Treasury": "QgJsoaUdHys",
        "Alchemist's Lab": "KWbo3PslD-M",
        "Medieval Feast": "klIstouu6pU",
        "Rainy Funeral": "aio5v9Fs870",
        "Snake Temple": "8wvtDdEWqms",
        "Buzzing Hive": "oZ2aCy43AOI",
        "Misty Swamp": "LC4am6qDWrk",
        "Eldritch Spell": "cuUb08zzBTY",
        "Nomad Camp": "pmuRfU8RS0A",
        "Ancient Tomb": "FWYqxqXkyXc",
        "Pirate Harbour": "h8dL9Igch60",
        "Tribunal of the Dead": "BzpdJXyR9Io",
        "Insanity Mansion": "qHsUQSRaqpg",
        "Secret Cult": "HuKBWPd-PI4",
        "Battle March": "MGQDtF_-UvE",
        "Thunder Forge": "N5M6stAd8uY",
        "Great Caravan": "_LmC4aDniAM",
        "Long Road": "PtktRQWAcxQ",
        "Frantic Chase": "bzHqm-AyaNM",
        "Public Execution": "oRP9mnTkgac",
        "Secluded Monastery": "wSUgTrA4u4M",
        "Sailing Ship": "pzn9t1Me6qk",
        "Heavenly Abode": "-LpBf87xuEw",
        "Crowded Tavern": "cbs558TPI3I",
        "Wild Tribe": "Ys5KpQSEsG8",
        "Slave Mines": "y6a66O0LIwE",
        "Spring Forest": "lJpJRygR6vQ",
        "Magical Vortex": "VzUVQMWyrWE",
        "Rowdy Arena": "OvX9YrCg0K4",
        "Burning Pits": "5Ze-4Ez0mXc",
        "Dreadful Hunt": "vNHisdJfBKA",
        "Lush Jungle": "2X71luNaHQc",
        "Joyful Festival": "gcPSA3sUilc",
        "Solemn Temple": "4ZDht1QyTjc",
        "Busy Market": "6ksms45EOIg",
        "Haunted Graveyard": "Ll0vtrU2oaI",
        "Calm Sea": "wm6AaLi-pzQ",
        "Raging Battle with many human warriors": "JEUTQJzKef4",
        "Winter Forest": "vuc0LK4LNWI",

        // from various
        "Pirate Battle": "6Ewt26G7ZE0",
        "Flight of the Dragons": "c7BCiWO7JVI",
        "Ride of the Valkyries": "jPlsEunHX-Q", // Wagner
        "Entrance of the Gods": "qEKnfbozTKw", // Wagner
        "Riding to Adventure": "h6YUm_sKjSA", // Holst, Jupiter
        "Battling the Titan": "zx0L0Zjjkms", // Holst, Mars
        "Great Hall": "9gfvqQ9_21M", // Holst, Vivace
        "Call of the Forest": "rf2GmdwFw80",
        "Tavern/Inn": "roABNwbjZf4",
        "The Adventure Begins": "q8R4MxLoOZM", // eh
        "Knight Tournament": "Kws7g5Qqae0", // eh

        // from https://www.youtube.com/@AjsDnDMusic/videos
        "Auril Rises Once More": "T4tCCZN_h5Q",
        "Fight Begins: Battling the Winter Goddess": "OJVKN5WPsjI",
        "Surviving Test of Frost": "oN4yv472eK0",
        "Frostmaiden's Abode": "hLxpatMoQ0o",
        "Bedtime Lullaby": "p3wpPG5e0Uk",
        "Fortress Of A God": "m67ZVI1PhtY",
        "Hopeless Night": "-v6T81lUtdQ",
        "Destruction's Light, Dragon's Devastation": "A2regj5sJMo",
        "Dragon Unleashed": "QStg_jjHNxY",
        "Assault on Sunblight Fortress": "eA7oX9cZyW8",
        "Sunblight Fortress, Impending Doom": "QoXdqL5bfaE",
        "Goliath Home": "q5Vrb-YYrcw",
        "Goblin Den": "KcBhMN0QLlI",
        "Lost Spire": "vr-mNBtC8OY",
        "Cackling Chasm": "VzihbhHejPY",
        "Giant's Jarlmoot": "x5kEkTE5J4M",
        "Dark Duchess": "DUf4mIiMdH8",
        "Cave of Berserkers": "lyBdRDQEnzg",
        "Sky Tower Shelter": "kDmE5yi1_1c",
        "Cauldron Caves": "0-4zFkXAocU",
        "Holed Up": "jB0qSv7IjNU",
        "Reghed Tribe Camp": "dclB2jVjV6c",
        "Revel's End": "DBJoJq0aFKc",
        "Mountain Climb": "RYBw_1__IuU",
        "Unseen Outpost": "Udl2NanfN0A",
        "Angajuk's Bell": "RRagMZWRfs8",
        "Id Ascendant": "tlNkZ-BxCck",
        "Black Cabin": "B56KxMtXc8Q",
        Combat: "ribfyGXZID8",
        "Nature Spirits": "udzOE6BqtXk",
        "Cold Hearted Killer": "RvF6FhWtnQs",
        "Cold Wind": "7ILGlFDVpQY",
        "Beautiful Town": "pSnl0Y5iF9M",
        "Fishing Fleet Town": "vfnnCWyprLQ",
        "Shady People in Lonelywood": "uIB1qrw8xuA",
        "Heart of the North, Good Mead": "-SJNs39kyUc",
        "Town of Tradition": "E4h6QNuvPRs",
        "Lonely Town": "sJdfw2nnsWk",
        "Invisible Thieves": "TVYb4t0k3ow",
        "Secret in Caer-Dineval": "Pg7FNacZCL8",
        "Cozy Inns of the North": "c40x9RW1r1E",
        "Gateway Town of the North": "Oiori413Y-8",
        "Lake Monster of Maer Dualdon": "ZXHy5CLPoNk",
        "Sleepy Town": "kEUj4U335YI",
        "Welcome To The Far North!": "u6wieZVCp9E",
        "A Calm Journey on the Seas": "832xOOXnjpk",

        "Sleeping Dragon": "51pRMJpjYvk",
        "Heavenly Crystal Bells": "9Q4DzzV2PW8",

        "Meditative Oud Music": "dRU494VecTw",
        "Upbeat Solo Oud Music": "a8W98IMtASU",
        "Causal Medium Paced Oud Music": "MOMfKe0RyN8",
        "Active Oud Music": "eA193gp5_j4",
        "Desert Oud Music": "NSnkRU0xpRM"
      },

      "Harry Potter": {
        "harry potter opening": "84j5uMdspmQ",
        // from https://www.youtube.com/watch?v=bVmlq3oThyA&list=PLgKQekWF68FoUGKh3XN7gyAOg3naozVuc
        "Brother Theme": "bVmlq3oThyA",
        "Main Music": "MgkIHQvCJRk",
        "Common Room Ravenclaw": "YJjuLE6b4pU",
        "Common Room Slytherin": "BinDSorqT-s",
        "Common Room Hufflepuff": "DXFAvnESj2Q",
        "Avatar Creation": "rlZpPJxdSDE",
        "Common Room Gryffindor": "aGg3DUg3u78",
        "Flying Class": "UowG3JGOsa8",
        "Diagon Alley Hagrid's Theme": "Xssu4pugmxQ",
        "Social Encounter": "sgr6oz5uGUk",
        "Three Broomsticks": "640-Fa-EzDI",
        "Dueling 1": "s0t5ZcNl9fk",
        Transfiguration: "8ll3-vcedpI",
        Hogsmeade: "f3QwKB2nOSw",
        "Merula Theme": "Jd3Qyh2GeHc",
        "General Suspense": "00eKgcXXEVQ",
        "Chores Studying": "r5jsDGmcUuI",
        "End of Year Graduation": "HULMJttWPVA",
        "Herbology Class": "f-1b_Wlj51c",
        "Welcome Feast": "1Wc-tqRCU6A",
        "Boss Fight Devils Snare": "BVU9kRUzTbM",
        "Plot Advance": "8SGIpHaNtXg",
        "Dueling 2": "g0qjMSxeAuo",
        "Intro To Hogwarts": "3YGKp1671yY",
        Zonkos: "A8rQIKe7YVs",

        // from https://www.youtube.com/playlist?list=PLbLGu6ODJC_8sIIc7QyOqtBXt8CJE9c2j
        "Slytherin Fireplace": "jqadj1gOORI",
        "Hufflepuff Fireplace": "c5eqVORqPN4",
        "Ravenclaw Fireplace": "ucHZ2KViPcA",
        "Gryffindor Fireplace": "hvDmfxqiV0g",

        // from https://www.youtube.com/watch?v=PzkE3dOYFVo
        "Tchaikovsky Waltz of the Flowers": "PzkE3dOYFVo",
        "Tchaikovsky Dance of the Sugar Plum Fairy": "w600ZPxZzSk"
      },

      "Studio Ghibli": {
        // various sources
        "Light a Way": "Le5zp7j7g1U",
        "Ghibli Piano LOFI": "ziEO5OS-Rdk",
        "Ghibli's Totoro Path of the Wind": "dOVoHFl1UyE",
        "Relaxing Piano Studio Ghibli": "0KPBxqjSjDc",
        "Ghibli Piano Medley": "UJMgdSRDZtI",
        "Peaceful Piano and soft nature sounds": "mym0_m5EgtU",
        "Stroll Sanpo": "5Wn2LOVlPPU",
        "Relaxing Vibrato Piano": "o56Jgs94Z_Q",
        "lofi chillpop": "0IwFM4LzX8Q",
        "Musicbox Grave of the Fireflies": "tFJotEXEri8",
        "Princess Mononoke Music On The Boat": "WUR7t__ICZw",
        "Princess Mononoke Ashitaka to San on Guitar": "2Z_xdUqbAQ4",
        "Princess Mononoke Legend of Ashitaka": "OP-wnnOn2ao",
        "Princess Mononoke Gods and Demons": "7k5GmlPJ6n8",
        "Journey to the West": "x-Qjej2zLFs", // eh
        //"Zelda Relaxing Breath of the Wild": "dHGrnuCEo4", // 1 hour
        //"Happy Ghibli Piano music": "aznnUTdg5Mk", // 3 hours
      },

      Trivia: {
        // from https://www.youtube.com/watch?v=3dSCuAu4ge4
        "waiting loop": "yVZ7g-EQzY8",
        countdown: "mXtIVwsRh3Q",
        question: "DliUjhJcgs4",
        winner: "CnFiJIgh1fE",
        "waiting oneshot": "sXdxe7uYKb8",
        "it's my time": "EItvLXjgcMA",
        "winner splash": "mz-sYKe3ES0",
        waiting: "8WGbzIXjSRw"
      },

      "Sound FX": {
        "gong": "_grH3Z5YHdI",
        "explosion": "HTXiJpCDiH4",
        "knocking on door": "HIJunF3DIjw",
        "creaking door opening": "ij5bdBI_JVA",
        "door closing": "PAPcSY20DYA",
        "heavy metal door opening and closing": "c90uCjVbW_g",
        "dramatic jungle drums": "3e1Acwh8GmQ",
        "sword fight": "4g-iCX2oST4",
        "sword slice": "VjrY6foiTxw",
        "critical axe hit": "Q6ab0gpaKIw",
        "dementor wailing": "8XbN5nIBuew",
        "dementor soul kiss": "ZUqDcr4lznU",
        "card shuffling": "dbfwV0-XCRY",
        "demonic laugh": "9Il8gAr7Ar4",
        "dark war horn": "kUw-fc2BYLo",
        "bright war horn": "o54owbOXrro",
        "cinematic war horn": "tsl854orF1I",
        "war horn with echo": "enQyoFCrSXY",
        "long war horn": "uHHMV8hukBI",
        "ork battle horn": "hPKTrrgMrmBc",
        "distant ominous war horn": "GCilFSXdLuM",
        "scary war horn": "C7YbRGABJ3U"
      },

      "Science Fiction": {
          //"Deep Thought": "IngU5tGtJQY", // only good for first 90 seconds
          "space hitchhiker harpsicord": "nGd7Zphv1J0", // good for hitchhikers
          "upbeat exploration": "sB6jXSr7_wQ", // good for hitchhikers
          "jaunty scifi": "vvkofC411Mo",
          "dramatic meditative exploration": "1E31BLIY4bQ",
          "dark suspenseful": "FSryKsTMp2M",
          "dark caverns and hallways": "pE7AwMfNYhM",
          "ethereal spooky": "gPcEQC5kzf4",
          "orbital surveillance": "iLUZgqrRU_U", // eh
          "deep into the core": "1GTfMOx01tI"
      },

      Horror: {
          "rough droning": "_z-Ew1L-iWc"
      },

      Humor: {
          "goofy detective": "ORNvyUiUTO8"
      }
    }
  }
}).initThisClass();
