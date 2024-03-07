"use strict";

/*

    BMResourceGroup

*/

(class BMResourceGroup extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }

    initPrototypeSlots () {
        this.newSlot("resourceClasses", [])
    }

    init () {
        super.init()
        this.setTitle(this.type())
        this.setNoteIsSubnodeCount(true)
        this.setResourceClasses([])
        this.setup()
        this.registerForAppDidInit()
    }

    setup () {
        // subclasses should override this to set ResourceClasses
    }

    appDidInit () {
        this.setupSubnodes()
        return this
    }

    extensions () {
        const exts = this.resourceClasses().map(rClass => rClass.supportedExtensions()).flat().unique()
        return exts
    }

    resourcePaths () {
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions())
    }

    urlResources () {
        return ResourceManager.shared().urlResourcesWithExtensions(this.extensions())
    }

    setupSubnodes () {
        //debugger
        this.urlResources().forEach(r => {
            const rClass = this.resourceClassForFileExtension(r.pathExtension())
            const aResource = rClass.clone().setPath(r.path())
            aResource.setUrlResource(r)
            //console.log("setup node '" + r.resourceHash() + "' '" + r.path() + "'")
            aResource.load()
            this.addResource(aResource)
        })

        //this.resourcePaths().forEach(path => this.addResourceWithPath(path))
        return this
    }

    resourceClassesForFileExtension (ext) {
        const extension = ext.toLowerCase()
        return this.resourceClasses().select(rClass => rClass.canHandleExtension(ext))
    }

    resourceClassForFileExtension (ext) {
        return this.resourceClassesForFileExtension(ext).first()
    }

    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension());
        if (!rClass) {
            debugger;
            this.resourceClassForFileExtension(aPath.pathExtension());

            return null
        };
        const aResource = rClass.clone().setPath(aPath)
        aResource.load()
        return aResource
    }

    /*
    addResourceWithPath (aPath) {
        const aResource = this.resourceForPath(aPath)
        this.addResource(aResource)
        return this
    }
    */

    addResource (aResource) {
        this.addSubnode(aResource)
        return this
    }

    resources () {
        return this.subnodes()
    }

    resourceNamed (name) {
        return this.resources().detect(r => r.name() == name)
    }

}.initThisClass());
