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
     */
    static initClass () {
        const globalValues = ["inherit", "initial", "revert", "revert-layer", "unset"].asSet();
        this.newClassSlot("globalValues", globalValues)
    }

    /**
     * @static
     * @description Returns an array of valid CSS properties for transitions.
     * @returns {string[]} Array of valid CSS properties.
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
     */
    initPrototypeSlots () {
        /**
         * @property {Object|null} global - Global transition value.
         */
        {
            const slot = this.newSlot("global", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @property {string} property - The CSS property to transition.
         */
        {
            const slot = this.newSlot("property", "");
            slot.setSlotType("String");
        }
        /**
         * @property {number} duration - The duration of the transition in seconds.
         */
        {
            const slot = this.newSlot("duration", 0);
            slot.setSlotType("Number");
        }
        /**
         * @property {string} timingFunction - The timing function of the transition.
         */
        {
            const slot = this.newSlot("timingFunction", "ease-in-out") // "linear", "ease", "ease-in", cubic-bezier(n, n, n, n)
            slot.setSlotType("String");
        }
        /**
         * @property {number} delay - The delay before the transition starts in seconds.
         */
        {
            const slot = this.newSlot("delay", 0) // set to number type (unit = seconds)
            slot.setSlotType("Number");
        }
        /**
         * @property {DomTransitions|null} transitions - The parent DomTransitions object.
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
     */
    updateTimingFunction (s) {
        this.setTimingFunction(s)
        this.syncToDomView()
        return this
    }

    /**
     * @description Returns the duration as a string with 's' appended if it's a number.
     * @returns {string} The duration string.
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
        console.log(this.type() + " asString() = '" + s + "'")
        return s
    }

    /**
     * @description Sets the transition properties from a string.
     * @param {string} aString - The string representation of the transition.
     * @returns {DomTransition} The current instance.
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

        debugger;
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
     */
    syncToDomView () {
        this.transitions().syncToDomView()
        return this
    }

}.initThisClass());