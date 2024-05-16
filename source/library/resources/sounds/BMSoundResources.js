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
        super.setup();
        this.setResourceClasses([WASound]);
        this.setSubnodeClasses([WASound]);
        return this;
    }

    addSound (aSound) {
        this.addResource(aSound)
        return this
    }

    sounds () {
        return this.resources()
    }

}.initThisClass());
