"use strict"

/*

    KinsaGroup

*/

window.KinsaGroup = class KinsaGroup extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
		return this
    }
    
    initPrototype () {
        this.newSlot("urlResource", null)
        this.newSlot("table", null)
    }

    init () {
        super.init()
        this.setTitle("Untitled " + this.type())
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(false)

        this.setUrlResource(BMUrlResource.clone())
        this.addSubnode(this.urlResource())

        this.setTable(JTable.clone())
        this.addSubnode(this.table())

        return this
    }

    subtitle () {
        return this.urlResource().subtitle()
        //return this.urlResource().isLoaded() ? "loaded" : ""
    }

    setupSubnodes () {
        return this
    }

    load () {
        this.urlResource().load()
        return this
    }

    refresh () {
        this.urlResource().refresh()
        return this
    }

    clear () {
        this.urlResource().clear()
        return this
    }

}.initThisClass()


