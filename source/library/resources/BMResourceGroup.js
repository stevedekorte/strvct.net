"use strict";

/*

    BMResourceGroup

*/

(class BMResourceGroup extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        this.newSlot("resourceClasses", []);
    }

    initPrototype () {
        this.setNoteIsSubnodeCount(true);
    }

    init () {
        super.init();
        this.setTitle(this.type());
        this.setResourceClasses([]);
        this.setup();
        this.registerForAppDidInit();
    }

    setup () {
        // subclasses should override this to set ResourceClasses
    }

    async appDidInit () {
        await this.setupSubnodes();
    }

    extensions () {
        const exts = this.resourceClasses().map(rClass => rClass.supportedExtensions()).flat().unique();
        return exts;
    }

    resourcePaths () {
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions());
    }

    urlResources () {
        return ResourceManager.shared().urlResourcesWithExtensions(this.extensions());
    }

    async setupSubnodes () {
        await this.urlResources().promiseParallelMap(async (r) => {
            const rClass = this.resourceClassForFileExtension(r.pathExtension());
            const aResource = rClass.clone().setPath(r.path());
            aResource.setUrlResource(r);
            //console.log("setup node '" + r.resourceHash() + "' '" + r.path() + "'")
            //await aResource.asyncLoad();
            aResource.asyncLoad(); // do this in parallel
            this.addResource(aResource);
        })

        //this.resourcePaths().forEach(path => this.addResourceWithPath(path))
        return this
    }

    resourceClassesForFileExtension (ext) {
        const extension = ext.toLowerCase();
        return this.resourceClasses().select(rClass => rClass.canHandleExtension(ext));
    }

    resourceClassForFileExtension (ext) {
        return this.resourceClassesForFileExtension(ext).first();
    }

    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension());
        if (!rClass) {
            debugger;
            this.resourceClassForFileExtension(aPath.pathExtension());
            return null;
        };
        const aResource = rClass.clone().setPath(aPath);
        //aResource.asyncLoad(); // this is done in prechacheWhereAppropriate
        return aResource;
    }

    /*
    addResourceWithPath (aPath) {
        const aResource = this.resourceForPath(aPath)
        this.addResource(aResource)
        return this
    }
    */

    addResource (aResource) {
        this.addSubnode(aResource);
        return this;
    }

    resources () {
        return this.subnodes();
    }

    resourceNamed (name) {
        return this.resources().detect(r => r.name() == name);
    }

    async prechacheWhereAppropriate () {
        await this.resources().promiseParallelMap(this.resources(), async (r) => r.prechacheWhereAppropriate());
        //await this.resources().promiseParallelMap(this.resources(), async (r) => await r.prechacheWhereAppropriate());
    }

}.initThisClass());
