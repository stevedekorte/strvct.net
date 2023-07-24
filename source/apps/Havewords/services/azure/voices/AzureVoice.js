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
      slot.setDuplicateOp("duplicate")
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

  language () {
    return this.localeName().before(" (")
  }

  sublocale () {
    const ln = this.localeName()
    const hasParens = ln.includes(" (") && ln.includes(")")
    if (hasParens) {
      const languageRegion = ln.after(" (").before(")")
      return languageRegion
    }
    return null
  }

  localePathComponents (allVoices = []) {
    const path = []
    const ln = this.localeName()
    const sublocale = this.sublocale()
    const isUnique = allVoices.select(voice => voice.sublocale() === sublocale).length === 1

    // we should not break out region if there is only one subregion
    if (sublocale && !isUnique) {
      const language = this.language()
      path.push(language)
      path.push(sublocale)
    } else {
      path.push(ln)
    }
    path.push(this.gender())
    //path.push(this.displayName())
    return path
  }

}).initThisClass();
