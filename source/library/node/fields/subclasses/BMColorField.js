"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMColorField
 * @extends BMField
 * @classdesc BMColorField represents a color field with red, green, blue, and alpha components.
 */
(class BMColorField extends BMField {
    
    /**
     * @static
     * @description Indicates if this field is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for the BMColorField.
     */
    initPrototypeSlots () {
        /**
         * @member {Number} red - The red component of the color.
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
     * @description Initializes the prototype of the BMColorField.
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
     */
    asCssColor () {
        return CssColor.clone().set(this.red(), this.green(), this.blue(), this.alpha())
    }

    /**
     * @description Sets the color field from a CSS color object.
     * @param {CssColor} aCssColor - The CSS color object to set the field from.
     * @returns {BMColorField} The current instance for method chaining.
     */
    fromCssColor (aCssColor) {
        return this
    }
    
}.initThisClass());