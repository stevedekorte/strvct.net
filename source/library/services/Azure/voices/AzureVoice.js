/**
 * @module library.services.Azure.voices
 */

"use strict";

/**
 * @class AzureVoice
 * @extends SvSummaryNode
 * @classdesc A wrapper around a json dictionary describing an Azure TTS Voice.
 */
(class AzureVoice extends SvSummaryNode {

    /**
   * @description Returns a sample entry for an Azure voice.
   * @returns {Object} Sample entry object
   * @category Data
   */
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
        };
    }

    /**
   * @description Initializes prototype slots for the AzureVoice class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Object} json - JSON representation of the Azure voice
     * @category Data
     */
        {
            const slot = this.newSlot("json", null);
            slot.setDuplicateOp("duplicate");
        }

        this.setupPrototypeSlotsForEntryProperties();
    }

    /**
   * @description Sets up prototype slots based on the sample entry properties.
   * @category Initialization
   */
    setupPrototypeSlotsForEntryProperties () {
        const sample = this.sampleEntry();
        const propertyNames = Object.keys(sample);
        propertyNames.forEach(propertyName => {
            const slotName = propertyName.uncapitalized();
            const slot = this.newSlot(slotName, null);
            const v = sample[propertyName];
            const typeName = Type.typeName(v);
            if (typeName === "String" || typeName === "Array") {
                slot.setSlotType(typeName);
            }
            //console.log(this.svType() + " added slot '" + slotName + "'")
        });
    }

    /**
   * @description Initializes the AzureVoice instance.
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Returns the title of the voice.
   * @returns {string} The display name of the voice
   * @category Display
   */
    title () {
        return this.displayName();
    }

    /**
   * @description Returns the subtitle of the voice.
   * @returns {string} Combination of gender and locale name
   * @category Display
   */
    subtitle () {
        return this.gender() + "\n" + this.localeName();
    }

    /**
   * @description Sets the JSON representation of the voice and syncs slots.
   * @param {Object} json - The JSON object to set
   * @returns {AzureVoice} The current instance
   * @category Data
   */
    setJson (json) {
        this._json = json;
        this.syncSlotsFromJson();
        return this;
    }

    /**
   * @description Synchronizes slots from the JSON representation.
   * @returns {AzureVoice} The current instance
   * @category Data
   */
    syncSlotsFromJson () {
        const json = this.json();
        Object.keys(json).forEach(k => {
            const v = json[k];
            const setter = "set" + k;
            const m = this[setter];
            if (m) {
                m.apply(this, [v]);
            } else {
                const msg = "missing setter '" + setter + "' for property '" + k + "' on json " + JSON.stringify(json);
                console.warn(msg);
                throw new Error(msg);
            }
        });
        return this;
    }

    /**
   * @description Checks if the voice supports a given style name.
   * @param {string} styleName - The style name to check
   * @returns {boolean} True if the style is supported, false otherwise
   * @category Voice Capabilities
   */
    supportsStyleName (styleName) {
        if (this.styleList()) {
            return this.styleList().includes(styleName);
        }
        return false;
    }

    /**
   * @description Returns the language of the voice.
   * @returns {string} The language name
   * @category Language
   */
    language () {
        return this.localeName().before(" (");
    }

    /**
   * @description Returns the sublocale of the voice.
   * @returns {string|null} The sublocale if available, null otherwise
   * @category Language
   */
    sublocale () {
        const ln = this.localeName();
        const hasParens = ln.includes(" (") && ln.includes(")");
        if (hasParens) {
            const languageRegion = ln.after(" (").before(")");
            return languageRegion;
        }
        return null;
    }

    /**
   * @description Generates the locale path components for the voice.
   * @param {Array} allVoices - All available voices
   * @returns {Array} The locale path components
   * @category Language
   */
    localePathComponents (allVoices = []) {
        const path = [];
        const ln = this.localeName();
        const sublocale = this.sublocale();
        const isUnique = allVoices.select(voice => voice.sublocale() === sublocale).length === 1;

        // we should not break out region if there is only one subregion
        if (sublocale && !isUnique) {
            const language = this.language();
            path.push(language);
            path.push(sublocale);
        } else {
            path.push(ln);
        }
        path.push(this.gender());
        //path.push(this.displayName())
        return path;
    }

}).initThisClass();
