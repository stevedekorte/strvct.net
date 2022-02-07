"use strict";

/*

    BMResources

*/

(class BMResources extends BMStorableNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }

    initPrototype () {
        this.newSlot("themes", null)
        this.newSlot("fonts", null)
        this.newSlot("sounds", null)
        this.newSlot("images", null)
        this.newSlot("icons", null)
        this.newSlot("json", null)
        this.newSlot("files", null)
    }

    init () {
        super.init()
        this.setShouldStore(false)

        this.setTitle("Resources")
        this.setSubtitle("")
        this.setNodeMinWidth(200)

        this.setupSubnodes()
        //this.watchOnceForNote("appDidInit")
    }

    setupSubnodes () {
        const themes = this.defaultStore().rootSubnodeWithTitleForProto("Themes", BMThemeResources)
        themes.setNodeCanReorderSubnodes(true)
        //this.addSubnode(themes)
        let link = this.addLinkSubnode(themes)
        //console.log("themes link = ", link.debugTypeId())

        this.setFonts(BMFontResources.shared())
        this.addSubnode(this.fonts())

        this.setSounds(BMSoundResources.shared())
        this.addSubnode(this.sounds())

        this.setImages(BMImageResources.shared())
        this.addSubnode(this.images())

        this.setIcons(BMIconResources.shared())
        this.addSubnode(this.icons())

        this.setJson(BMJsonResources.shared())
        this.addSubnode(this.json())

        this.setFiles(BMFileResources.shared())
        this.addSubnode(this.files())

        return this
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

}.initThisClass());
