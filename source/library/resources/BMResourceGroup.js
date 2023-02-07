"use strict";

/*

    BMSoundResources

*/

(class BMResourceGroup extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }

    initPrototypeSlots () {
        this.newSlot("extensions", [])
        this.newSlot("resourceClasses", [])
    }

    init () {
        super.init()
        this.setTitle(this.type())
        this.setNoteIsSubnodeCount(true)
        this.setExtensions([]) 
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

    setupSubnodes () {
        this.resourcePaths().forEach(path => this.addResourceWithPath(path))
        return this
    }

    resourceClassesForFileExtension (extension) {
        extension = extension.toLowerCase()
        return this.resourceClasses().select(rClass => rClass.canHandleExtension(extension))
    }

    resourceClassForFileExtension (extension) {
        return this.resourceClassesForFileExtension(extension).first()
    }

    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension())
        const aResource = rClass.clone().setPath(aPath).load()
        return aResource
    }

    addResourceWithPath (aPath) {
        const aResource = this.resourceForPath(aPath)
        this.addResource(aResource)
        return this
    }

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
