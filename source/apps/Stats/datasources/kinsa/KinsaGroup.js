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
        this.newSlot("jsonResource", null)
        this.newSlot("table", null)
    }

    init () {
        super.init()
        this.setTitle("Untitled " + this.type())
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(false)

        this.setJsonResource(BMUrlResource.clone())
        this.addSubnode(this.jsonResource())

        this.setTable(JTable.clone())
        this.addSubnode(this.table())

        return this
    }

    subtitle () {
        return this.jsonResource().subtitle()
        //return this.jsonResource().isLoaded() ? "loaded" : ""
    }

    setupSubnodes () {
        return this
    }

    load () {
        this.jsonResource().load()
        return this
    }

    refresh () {
        this.jsonResource().refresh()
        return this
    }

    clear () {
        this.jsonResource().clear()
        return this
    }

}.initThisClass()


