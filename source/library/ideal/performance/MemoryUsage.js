"use strict";

/*

    MemoryUsage

    Example use:



*/

(class MemoryUsage extends ProtoClass { 

    initPrototypeSlots () {
        this.newSlot("snapshots", null)
    }

    init () {
        super.init()
        this.setSnapshots([])
        return this
    }

    // --- events ---

    setup () {
        document.addEventListener("mousedown", (event) => this.onMouseDownCapture(event), true);
    }

    onMouseDownCapture (event) {
        this.takeSnapshot()
    }

    // --- snapshots ---

    instanceSet () {
        return ProtoClass.allInstancesWeakSet()
    }

    takeSnapshot () {
        this.forceGC()

        const snapshot = this.instanceSet().keysArray().asSet()
        this.snapshots().push(snapshot)

        let title = this.snapshots().length + " snaps, " + snapshot.count() + " objs";

        if (this.snapshots().length > 2) {
            const stragglers = this.findStragglersMap()
            const classes = this.classesForMap(stragglers)
            /*
            console.log("stragglers:")
            stragglers.forEach((k, v) => {
                console.log(k + ":" + v)
            })
            */
            this.showMap(classes)
            title += ", " + stragglers.size + " strags"
        }

        document.title = title;
    }

    showMap (m) {
        console.log("straggler classes:")
        const classes = new Map()
        m.forEachKV((k, v) => {
            console.log(k + ":" + v)
        })
    }

    forceGC () {
        const array = []
        const max = 10000000
        for (let i = 0; i < max; i++) {
            const tmp = new Object()
            array.push(tmp)
        }
        // there may be a bunch of Objects left uncollected,
        // but we're only tracking ProtoClass subclasses
    }

    findStragglersMap () {
        const snapCount = this.snapshots().length
        assert(snapCount > 2)

        const sn1 = this.snapshots()[snapCount-3].keysArray().asSet()
        const sn2 = this.snapshots()[snapCount-2].keysArray().asSet()
        const sn3 = this.snapshots()[snapCount-1].keysArray().asSet()

        console.log("-------------------------")
        console.log("sn1.size: ", sn1.size)
        console.log("sn2.size: ", sn2.size)
        console.log("sn3.size: ", sn3.size)


        const newObjects = sn2.difference(sn1)
        const stragglers = sn3.intersection(newObjects)

        console.log("stragglers.size: ", stragglers.size)

        const instanceSet = this.instanceSet()
        const stragMap = new Map()
        stragglers.forEach(pid => {
            const v = instanceSet._refs.get(pid)
            if (Type.isObject(v)) {
                stragMap.set(v.typeId(), v)
            } else {
                console.log("strag value:", v)
            }
        })
        console.log("stragMap.size: ", stragMap.size)
        console.log("-------------------------")

        return stragMap
    }

    classesForMap (m) {
        const classes = new Map()

        m.forEach(v => {
            const type = v.type()
            const count = classes.get(type)
            if (count === undefined) {
                classes.set(type, 1) 
            } else {
                classes.set(type, count + 1)
            }
        })

        return classes
    }
    
}.initThisClass());


MemoryUsage.shared() //.setup()


    /*
        const classes = new Map()

        this.instanceSet().forEach(v => {
            const type = v.type()
            const count = classes.get(type)
            if (count === undefined) {
                classes.set(type, 1) 
            } else {
                classes.set(type, count + 1)
            } 
        })

            countOfClass (aClass) {
        let total = 0
        this.snapshot().forEachKV((className, instanceCount) => {
            const instClass = getGlobalThis()[className]
            if (instClass.isKindOf(aClass)) {
                total += instanceCount
            }
        })
        return total
    }
    */