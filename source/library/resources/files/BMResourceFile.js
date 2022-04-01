"use strict";

/*

    BMFileResources

*/

(class BMResourceFile extends BMNode {

    initPrototype () {
        this.newSlot("path", ".")
    }

    init () {
        super.init()

        this.setTitle("File")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        //this.setupSubnodes()
        return this
    }

    name () {
        return this.path().lastPathComponent()
    }

    title () {
        return this.name()
    }

    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }

    asObject () {
        const sound = BMSoundResources.shared().resources().detect(r => r.path() == this.path())
        return sound
    }

}.initThisClass());
