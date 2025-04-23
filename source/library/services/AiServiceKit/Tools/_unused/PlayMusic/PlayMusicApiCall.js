"use strict";


(class PlayMusicApiCall extends AssistantApiCall {

  static jsonSchemaDescription () {
    return "Format for Assistant API call to play a music track.";
  }

  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.overrideSlot("apiType", "PlayMusicApiCall");
      slot.setSlotType("String");
      slot.setValidValues(["PlayMusicApiCall"]);
    }

    {
      const slot = this.overrideSlot("payload", null);
      slot.setDescription("The name of the music track to play.");
      slot.setSlotType("String");
      //slot.setValidValues(this.getMusicTrackNames());
    }

  }

  finalInit () {
    super.finalInit();
  }

  setupPayloadSlot () {
    const payloadSlot = this.thisPrototype().slotNamed("payload");
    if (payloadSlot.validValues() === null) {
      payloadSlot.setValidValues(this.getMusicTrackNames());
    }
  }

  getMusicTrackNames () {
    const playlistNames = ["Fantasy"];
    const tracks = this.session().musicLibrary().tracksForPlaylistsWithNames(playlistNames);
    const names = tracks.map(track => track.name());
    return names
  }

  handleCall () {
    const payload = this.payload();
    const trackName = payload.trackName;
    this.session().musicPlayer().playTrackWithName(trackName);
  }

}.initThisClass());
