"use strict"

/*

    BMResources

*/

window.BMResources = class BMResources extends BMStorableNode {
    
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
        console.log("themes link = ", link.debugTypeId())

        console.log("themes = ", themes.debugTypeId())
        console.log("themes.subnodes().length = ", themes.subnodes().length)

        this.setFonts(BMFontResources.shared())
        this.addSubnode(this.fonts())

        this.setSounds(BMSoundResurces.shared())
        this.addSubnode(this.sounds())

        this.setImages(BMImageResources.shared())
        this.addSubnode(this.images())

        this.setIcons(BMIconResources.shared())
        this.addSubnode(this.icons())

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

}.initThisClass()
