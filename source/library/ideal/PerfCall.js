"use strict";

/*

    PerfCall

*/

(class PerfCall extends ProtoClass { 

    initPrototypeSlots () {
        this.newSlot("name", null) // name can be a string or a closure that returns a string
        this.newSlot("function", null)
        this.newSlot("t0", null)
        this.newSlot("t1", null)
        this.newSlot("depth", 0)
    }

    init () {
        super.init()
        return this
    }

    do () {
        const f = this.function()
        this.setT0(performance.now())
        const result = f()
        this.setT1(performance.now())
        return result
    }

    dt () {
        return this.t1() - this.t0()
    }

    indent () {
        return  "-> ".repeat(this.depth())
    }

    getName () {
        const n = this.name()
        const k = Type.isFunction(n) ? n() : n;
        return k
    }

    description () {
        const d = this.getName() + " - " + Math.floor(this.dt()/10)/100 + "s"
        return this.indent() + d
    }

    show () {
        console.log("[timeCall] " + this.description())
    }
    
}.initThisClass());

