/**
 * @module library.resources.sounds
 */

/**
 * @class SvSoundResources
 * @extends SvResourceGroup
 * @classdesc Represents a collection of sound resources.
 */
(class SvSoundResources extends SvResourceGroup {

    /**
     * @description Initializes the SvSoundResources instance.
     * @member {function}
     * @category Initialization
     */
    init () {
        super.init();
        this.setTitle("Sounds");
    }

    /**
     * @description Sets up the SvSoundResources instance.
     * @returns {SvSoundResources} The current instance.
     * @member {function}
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([SvWaSound]);
        this.setSubnodeClasses([SvWaSound]);
        return this;
    }

    /**
     * @description Adds a sound to the collection.
     * @param {SvWaSound} aSound - The sound to add.
     * @returns {SvSoundResources} The current instance.
     * @member {function}
     * @category SoundManagement
     */
    addSound (aSound) {
        this.addResource(aSound);
        return this;
    }

    /**
     * @description Gets all sounds in the collection.
     * @returns {Array<SvWaSound>} An array of sounds.
     * @member {function}
     * @category SoundManagement
     */
    sounds () {
        return this.resources();
    }

    async prechacheWhereAppropriate () {
    }

}.initThisClass());
