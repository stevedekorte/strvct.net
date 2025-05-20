"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvColorField
 * @extends SvField
 * @classdesc SvColorField represents a color field with red, green, blue, and alpha components.
 */
(class SvColorField extends SvField {
    
    /**
     * @static
     * @description Indicates if this field is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     * @category Metadata
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for the SvColorField.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} red - The red component of the color.
         * @category Color Components
         */
        {
            const slot = this.newSlot("red", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        /**
         * @member {Number} green - The green component of the color.
         * @category Color Components
         */
        {
            const slot = this.newSlot("green", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        /**
         * @member {Number} blue - The blue component of the color.
         * @category Color Components
         */
        {
            const slot = this.newSlot("blue", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        /**
         * @member {Number} alpha - The alpha (opacity) component of the color.
         * @category Color Components
         */
        {
            const slot = this.newSlot("alpha", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }
    }

    /**
     * @description Initializes the prototype of the SvColorField.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("color");
        this.setSubtitle(null);
        this.setCanDelete(true);
        this.setNodeCanInspect(true);
        this.setNodeCanAddSubnode(true);
    }

    /**
     * @description Converts the color field to a CSS color object.
     * @returns {CssColor} A CSS color object representing the current color.
     * @category Conversion
     */
    asCssColor () {
        return CssColor.clone().set(this.red(), this.green(), this.blue(), this.alpha())
    }

    /**
     * @description Sets the color field from a CSS color object.
     * @param {CssColor} aCssColor - The CSS color object to set the field from.
     * @returns {SvColorField} The current instance for method chaining.
     * @category Conversion
     */
    fromCssColor (aCssColor) {
        return this
    }
    
}.initThisClass());