"use strict";

/*

    Perf

    Example use:

        Perf.timeCall("MyObject someMethod", () => { ...stuff to time... })

    At the end of the event loop, a report will be printed to the console of
    any labels who have cumulatively exceeded Perf.shared().minDt() in milliseconds.
    
*/

(class Perf extends ProtoClass { 

    initPrototypeSlots () {
        this.newSlot("callStack", null)
        this.newSlot("minDt", 200) // in milliseconds
        this.newSlot("calls", null) // in milliseconds
    }

    init () {
        super.init()
        this.setCallStack([])
        this.setCalls([])
        return this
    }

    static timeCall (name, fn) {
        return this.shared().timeCall(name, fn)
    }

    /*
    static reportOn (name) {
        this.shared().reportOn(name)
    }
    */

    timeCall (name, fn) {
        assert(Type.isString(name))

        const call = PerfCall.clone()
        call.setName(name)
        call.setFunction(fn)
        call.setDepth(this.callStack().length)

        this.callStack().push(call)
        const result = call.do()
        if (call.dt() > this.minDt()) {
            //call.show()
        }
        this.callStack().pop()
        this.calls().push(call)
        return result
    }

    callsNamed (name) {
        return this.calls().filter(call => call.name() === name)
    }

    sumOfCallsNamed (name) {
        return this.callsNamed(name).map(call => call.dt()).sum()
    }

    reportOn (name) {
        const sum = this.sumOfCallsNamed(name)
        //debugger;
        if (sum > this.minDt()) {
            const count = this.callsNamed(name).length
            const sum = this.sumOfCallsNamed(name)
            const indent = this.callsNamed(name).first().indent()

            return { description: "[timeCallSum " + count + " x] " + indent + "" + name + " - " + Math.floor(sum/10)/100 + "s", sum: sum }
        }
        return null
    }

    names () {
        const names = new Set()
        this.calls().forEach(call => names.add(call.name()))
        return names
    }

    report () {
        const reports = this.names().map(name => this.reportOn(name)).filter(r => !Type.isNull(r) && r.sum > this.minDt())
        if (reports.length) {
            console.log("---")
            reports.forEach(r => {
                console.log(r.description)
            })
            console.log("---")
        }
    }

    static clearCalls () {
        this.shared().clearCalls()
    }

    clearCalls () {
        this.report()
        this.setCalls([])
        return this
    }

    
}.initThisClass());


