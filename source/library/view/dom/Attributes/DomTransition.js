"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class DomTransition
 * @extends ProtoClass
 * @classdesc Represents a DOM transition with properties like duration, timing function, and delay.
 */
(class DomTransition extends ProtoClass {
    
    /**
     * @static
     * @description Initializes the class with global values for transitions.
     * @category Initialization
     */
    static initClass () {
        const globalValues = ["inherit", "initial", "revert", "revert-layer", "unset"].asSet();
        this.newClassSlot("globalValues", globalValues)
    }

    /**
     * @static
     * @description Returns an array of valid CSS properties for transitions.
     * @returns {string[]} Array of valid CSS properties.
     * @category Validation
     */
    static validPropertyValues () {
        return [  "background-color",  "background-position",  "border-color",  "border-width",  "border-spacing",  
        "bottom",  "color",  "font-size",  "font-weight",  "height",  "left",  "letter-spacing",  "line-height",  
        "margin",  "margin-bottom",  "margin-left",  "margin-right",  "margin-top",  "max-height",  "max-width",  
        "min-height",  "min-width",  "opacity",  "outline-color",  "outline-offset",  "outline-width",  "padding",  
        "padding-bottom",  "padding-left",  "padding-right",  "padding-top",  "right",  "text-indent",  "text-shadow",  
        "top",  "vertical-align",  "visibility",  "width",  "word-spacing",  "z-index"]
    }

    /**
     * @description Initializes the prototype slots for the DomTransition class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Object|null} global - Global transition value.
         * @category Properties
         */
        {
            const slot = this.newSlot("global", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {string} property - The CSS property to transition.
         * @category Properties
         */
        {
            const slot = this.newSlot("property", "");
            slot.setSlotType("String");
        }
        /**
         * @member {number} duration - The duration of the transition in seconds.
         * @category Properties
         */
        {
            const slot = this.newSlot("duration", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {string} timingFunction - The timing function of the transition.
         * @category Properties
         */
        {
            const slot = this.newSlot("timingFunction", "ease-in-out") // "linear", "ease", "ease-in", cubic-bezier(n, n, n, n)
            slot.setSlotType("String");
        }
        /**
         * @member {number} delay - The delay before the transition starts in seconds.
         * @category Properties
         */
        {
            const slot = this.newSlot("delay", 0) // set to number type (unit = seconds)
            slot.setSlotType("Number");
        }
        /**
         * @member {DomTransitions|null} transitions - The parent DomTransitions object.
         * @category Properties
         */
        {
            const slot = this.newSlot("transitions", null);
            slot.setSlotType("DomTransitions");
            slot.setAllowsNullValue(true);
        }
    }

    /*
    init () {
        super.init()
    }
    */

    /**
     * @description Clears all transition properties.
     * @returns {DomTransition} The current instance.
     * @category Manipulation
     */
    clear () {
        this.setGlobal(null)
        this.setProperty(null)
        this.setDuration(0)
        this.setTimingFunction("")
        this.setDelay(0)
        return this
    }

    /**
     * @description Updates the duration of the transition.
     * @param {number|string} s - The new duration value.
     * @returns {DomTransition} The current instance.
     * @category Manipulation
     */
    updateDuration (s) {
        if (Type.isNumber(s)) {
            s = s + "s"
        }
        this.setDuration(s)
        this.syncToDomView()
        return this
    }

    /**
     * @description Updates the delay of the transition.
     * @param {number|string} s - The new delay value.
     * @returns {DomTransition} The current instance.
     * @category Manipulation
     */
    updateDelay (s) {
        this.setDelay(s)
        this.syncToDomView()
        return this
    }

    /**
     * @description Updates the timing function of the transition.
     * @param {string} s - The new timing function value.
     * @returns {DomTransition} The current instance.
     * @category Manipulation
     */
    updateTimingFunction (s) {
        this.setTimingFunction(s)
        this.syncToDomView()
        return this
    }

    /**
     * @description Returns the duration as a string with 's' appended if it's a number.
     * @returns {string} The duration string.
     * @category Utility
     */
    durationString () {
        const v = this.duration()
        if (Type.isNumber(v)) {
            return v + "s"
        }
        return v
    }

    /**
     * @description Returns the delay as a string with 's' appended if it's a number.
     * @returns {string} The delay string.
     * @category Utility
     */
    delayString () {
        const v = this.delay()
        if (Type.isNumber(v)) {
            return v + "s"
        }
        return v
    }

    /**
     * @description Converts the transition to a string representation.
     * @returns {string} The string representation of the transition.
     * @category Conversion
     */
    asString () {
        if (this.global()) {
            return this.global()
        }

        const parts = [
            this.property(),
            this.durationString(),
            this.timingFunction()
            //this.delayString(),
        ]

        const s = parts.join(" ")
        console.log(this.svType() + " asString() = '" + s + "'")
        return s
    }

    /**
     * @description Sets the transition properties from a string.
     * @param {string} aString - The string representation of the transition.
     * @returns {DomTransition} The current instance.
     * @category Manipulation
     */
    setFromString (aString) {
        // ordering of parts: 
        //   transition-property, 
        //   transition-duration, 
        //   transition-timing-function, 
        //   transition-delay.
        //

        const startsWithNumber = function (s) {
            if (s.length) {
                const c = s[0]
                return (c >= '0' && c <= '9');
            }
            return false
        }

        const parts = aString.split(" ").select(part => part !== "")

        this.clear()

        if (parts.length === 1 && this.thisClass().validGlobalValues().has(parts[0])) {
            this.setGlobal(parts[0])
            return this
        }

        let v = parts.removeFirst()
        assert(!Type.isNull(v))
        this.setProperty(v)

        v = parts.removeFirst()
        if (!Type.isNull(v)) {
            assert(startsWithNumber(v))
            this.setDuration(v)
        }

        v = parts.removeFirst()
        if (!Type.isNull(v)) {
            this.setTimingFunction(v)
        }

        v = parts.removeFirst()
        if (!Type.isNull(v)) {
            assert(startsWithNumber(v))
            this.setDelay(v)
        }

        return this
    }

    /**
     * @description Synchronizes the transition with the DOM view.
     * @returns {DomTransition} The current instance.
     * @category Synchronization
     */
    syncToDomView () {
        this.transitions().syncToDomView()
        return this
    }

}.initThisClass());