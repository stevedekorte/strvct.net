
"use strict";

/*

    DomTransition
         

*/

(class DomTransition extends ProtoClass {
    
    static initClass () {
        const globalValues = ["inherit", "initial", "revert", "revert-layer", "unset"].asSet();
        this.newClassSlot("globalValues", globalValues)
    }

    static validPropertyValues () {
        return [  "background-color",  "background-position",  "border-color",  "border-width",  "border-spacing",  
        "bottom",  "color",  "font-size",  "font-weight",  "height",  "left",  "letter-spacing",  "line-height",  
        "margin",  "margin-bottom",  "margin-left",  "margin-right",  "margin-top",  "max-height",  "max-width",  
        "min-height",  "min-width",  "opacity",  "outline-color",  "outline-offset",  "outline-width",  "padding",  
        "padding-bottom",  "padding-left",  "padding-right",  "padding-top",  "right",  "text-indent",  "text-shadow",  
        "top",  "vertical-align",  "visibility",  "width",  "word-spacing",  "z-index"]
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("global", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("property", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("duration", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("timingFunction", "ease-in-out") // "linear", "ease", "ease-in", cubic-bezier(n, n, n, n)
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("delay", 0) // set to number type (unit = seconds)
            slot.setSlotType("Number");
        }
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

    clear () {
        this.setGlobal(null)
        this.setProperty(null)
        this.setDuration(0)
        this.setTimingFunction("")
        this.setDelay(0)
        return this
    }

    updateDuration (s) {
        if (Type.isNumber(s)) {
            s = s + "s"
        }
        this.setDuration(s)
        this.syncToDomView()
        return this
    }

    updateDelay (s) {
        this.setDelay(s)
        this.syncToDomView()
        return this
    }

    updateTimingFunction (s) {
        this.setTimingFunction(s)
        this.syncToDomView()
        return this
    }

    durationString () {
        const v = this.duration()
        if (Type.isNumber(v)) {
            return v + "s"
        }
        return v
    }

    delayString () {
        const v = this.delay()
        if (Type.isNumber(v)) {
            return v + "s"
        }
        return v
    }

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

    syncToDomView () {
        this.transitions().syncToDomView()
        return this
    }

}.initThisClass());


