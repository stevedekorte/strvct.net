/**
 * @module library.resources.fonts
 */

/**
 * @class BMFontFamily
 * @extends BaseNode
 * @classdesc Represents a font family containing multiple fonts.
 */
(class BMFontFamily extends BaseNode {
    
    /**
     * Initialize prototype slots for the BMFontFamily.
     * @private
     */
    initPrototypeSlots () {
        /**
         * @property {String} name - The name of the font family.
         */
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        /**
         * @property {Array} fonts - The array of fonts in the family.
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
     * @returns {BMFontFamily} The current instance for method chaining.
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