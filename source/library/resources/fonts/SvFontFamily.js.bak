/**
 * @module library.resources.fonts
 */

/**
 * @class SvFontFamily
 * @extends BaseNode
 * @classdesc Represents a font family containing multiple fonts.
 */
(class SvFontFamily extends BaseNode {
    
    /**
     * Initialize prototype slots for the SvFontFamily.
     * @private
     */
    initPrototypeSlots () {
        /**
         * @member {String} name - The name of the font family.
         * @category Properties
         */
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Array} fonts - The array of fonts in the family.
         * @category Properties
         */
        {
            const slot = this.newSlot("fonts", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * Initialize the prototype.
     * @private
     */
    initPrototype () {
    }

    /**
     * Get the title of the font family.
     * @returns {string} The name of the font family.
     * @category Getters
     */
    title () {
        return this.name()
    }

    /*
    subtitle () {
        return "font family"
    }
    */

    /**
     * Add a font to the family.
     * @param {Object} aFont - The font to add.
     * @returns {SvFontFamily} The current instance for method chaining.
     * @category Modification
     */
    addFont (aFont) {
        //debugger
        this.addSubnode(aFont)
        return this
    }

    /*
    addFontWithResource (aResource) {
        const font = BMFont.clone().setResource(aResource)
        font.load()
        this.addSubnode(font)
        return this
    }
    */

}.initThisClass());