/**
 * @module library.resources.sounds
 */

/**
 * @class BMSoundResources
 * @extends BMResourceGroup
 * @classdesc Represents a collection of sound resources.
 */
(class BMSoundResources extends BMResourceGroup {

    /**
     * @description Initializes the BMSoundResources instance.
     * @member {function}
     * @category Initialization
     */
    init () {
        super.init()
        this.setTitle("Sounds")
    }

    /**
     * @description Sets up the BMSoundResources instance.
     * @returns {BMSoundResources} The current instance.
     * @member {function}
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([WASound]);
        this.setSubnodeClasses([WASound]);
        return this;
    }

    /**
     * @description Adds a sound to the collection.
     * @param {WASound} aSound - The sound to add.
     * @returns {BMSoundResources} The current instance.
     * @member {function}
     * @category SoundManagement
     */
    addSound (aSound) {
        this.addResource(aSound)
        return this
    }

    /**
     * @description Gets all sounds in the collection.
     * @returns {Array<WASound>} An array of sounds.
     * @member {function}
     * @category SoundManagement
     */
    sounds () {
        return this.resources()
    }

}.initThisClass());