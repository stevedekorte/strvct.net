"use strict";

/*

    BMResources

    BMResources.shared().files().resourceForPath("./app/sessions/session/Settings/prompt/MainPrompt_Claude3.txt") 

*/

(class BMResources extends BMStorableNode {
    
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        //this.newSlot("themes", null);
        this.newSlot("fonts", null);
        this.newSlot("sounds", null);
        this.newSlot("images", null);
        this.newSlot("icons", null);
        this.newSlot("json", null);
        this.newSlot("files", null);
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setTitle("Resources");
        this.setSubtitle("");
    }

    init () {
        super.init();
        this.setupSubnodes(); // don't need to wait for appDidInit?
        //this.watchOnceForNote("appDidInit");
    }

    setupSubnodes () {
        //const themes = this.defaultStore().rootSubnodeWithTitleForProto("Themes", BMThemeResources);
        //themes.setNodeCanReorderSubnodes(true);
        //this.addSubnode(themes);
        //let link = this.addLinkSubnode(themes);
        //this.setThemes(themes);
        //console.log("themes link = ", link.debugTypeId());

        this.setFiles(BMFileResources.shared());
        this.addSubnode(this.files());

        this.setFonts(BMFontResources.shared());
        this.addSubnode(this.fonts());

        this.setSounds(BMSoundResources.shared());
        this.addSubnode(this.sounds());

        this.setImages(BMImageResources.shared());
        this.addSubnode(this.images());

        this.setIcons(BMIconResources.shared());
        this.addSubnode(this.icons());

        this.setJson(BMJsonResources.shared());
        this.addSubnode(this.json());

        return this;
    }

    /*
    appDidInit () {
        this.findResources()
    }

    findResources () {
        this.sendRespondingSubnodes("findResources")
        return this
    }

    loadResources () {
        this.sendRespondingSubnodes("loadResources")
        return this
    }
    */

    resourceClassesForFileExtension (extension) {
        return this.subnodes().map(sn => sn.resourceClassesForFileExtension(extension)).flat()
    }

    resourceClassForFileExtension (extension) {
        return this.resourceClassesForFileExtension(extension).first()
    }

    resourceForPath (aPath) {
        const rClass = this.resourceClassForFileExtension(aPath.pathExtension())
        /*
        if (!rClass) {
            // do we want this behavior?
            // What's the typical use case for this method
            rClass = BMResourceFile; 
        }
        */
        if (rClass) {
            const aResource = rClass.clone().setPath(aPath).load()
            return aResource
        }
        return null
    }


}.initThisClass());
