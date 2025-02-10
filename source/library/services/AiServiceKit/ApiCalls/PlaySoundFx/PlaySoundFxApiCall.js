"use strict";


(class PlaySoundFxApiCall extends AssistantApiCall {

  static jsonSchemaDescription () {
    return "Format for Assistant API call to play a sound effect.";
  }

  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.overrideSlot("apiType", "PlaySoundFxApiCall");
      slot.setSlotType("String");
      slot.setValidValues(["PlaySoundFxApiCall"]);
    }

    {
      const slot = this.overrideSlot("payload", null);
      slot.setDescription("The name of the sound effect to play.");
      slot.setSlotType("String");
    }

  }

  setupPayloadSlot () {
    this.thisPrototype().slotNamed("payload").setValidValues(this.soundEffectTrackNames());
  }

  soundEffectTrackNames () {
    const tracks = this.session().musicLibrary().tracksForPlaylistsWithNames(["Sound FX"]);
    const names = tracks.map(track => track.name());
    return names;
  }

  handleCall () {
    const payload = this.payload();
    const trackName = payload.trackName;
    this.session().musicLibrary().playSoundEffectWithName(trackName);
  }

}.initThisClass());
