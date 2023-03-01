"use strict";

/*

    BMSoundResources

*/

(class BMSoundResources extends BMResourceGroup {

    init () {
        super.init()
        this.setTitle("Sounds")
    }

    setup () {
        // subclasses need to use this to set ResourceClasses
        this.setResourceClasses([WASound])
    }

    addSound (aSound) {
        this.addResource(aSound)
        return this
    }

    sounds () {
        return this.resources()
    }

}.initThisClass());
