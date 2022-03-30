"use strict";

/*

    BMImageResources

*/

(class BMImageResources extends BMResourceGroup {
    

    init () {
        super.init()
        this.setTitle("Images")
        this.setSubnodeClasses([BMURLImage])
        return this
    }

    setup () {
        // subclasses need to use this to set ResourceClasses
        this.setResourceClasses([BMURLImage])
    }

    /*
    setupSubnodes () {
        this.resourcePaths().forEach(path => this.addImageWithPath(path))
        return this
    }

    addImageWithPath (aPath) {
        const image = this.justAdd()
        image.setPath(aPath)
        return this
    }
    */

}.initThisClass());
