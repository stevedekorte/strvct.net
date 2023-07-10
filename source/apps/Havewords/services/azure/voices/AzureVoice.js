"use strict";

/* 
    AzureVoice

    A wrapper around a json dictionary describing an Azure TTS Voice.

*/


(class AzureVoice extends BMSummaryNode {

  sampleEntry () {
    return {
      Name: "Microsoft Server Speech Text to Speech Voice (en-US, JaneNeural)",
      DisplayName: "Jane",
      LocalName: "Jane",
      ShortName: "en-US-JaneNeural",
      Gender: "Female",
      Locale: "en-US",
      LocaleName: "English (United States)",
      SecondaryLocaleList: [],
      StyleList: ["whispering"],
      SampleRateHertz: "48000",
      VoiceType: "Neural",
      Status: "GA",
      WordsPerMinute: "154",
      RolePlayList: []
    }
  }

  initPrototypeSlots () {
    {
      const slot = this.newSlot("json", null)
    }

    this.setupPrototypeSlotsForEntryProperties()
  }

  setupPrototypeSlotsForEntryProperties () {
    const sample = this.sampleEntry()
    const propertyNames = Object.keys(sample)
    propertyNames.forEach(propertyName => {
      const slotName = propertyName.uncapitalized()
      const slot = this.newSlot(slotName, null)
      const v = sample[propertyName]
      const typeName = Type.typeName(v)
      if (typeName === "String" || typeName === "Array") {
        slot.setSlotType(typeName)
      }
      //console.log(this.type() + " added slot '" + slotName + "'")
    })
  }

  init () {
    super.init()
  }

  title () {
    return this.displayName()
  }

  subtitle () {
    return this.gender() + "\n" + this.localeName()
  }

  setJson (json) {
    this._json = json
    this.syncSlotsFromJson()
    return this
  }

  syncSlotsFromJson () {
    const json = this.json()
    Object.keys(json).forEach(k => {
      const v = json[k]
      const setter = "set" + k
      const m = this[setter]
      if (m) {
        m.apply(this, [v])
      } else {
        const msg = "missing setter '" + setter + "' for property '" + k + "' on json " + JSON.stringify(json);
        console.warn(msg)
        throw new Error(msg)
      }
    })
    return this
  }

  // --- helpers ---

  supportsStyleName (styleName) {
    if (this.styleList()) {
      return this.styleList().includes(styleName)
    }
    return false
  }

}).initThisClass();
