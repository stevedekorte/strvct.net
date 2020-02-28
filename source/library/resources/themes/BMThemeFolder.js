"use strict"

/*

    BMThemeFolder

*/

window.BMThemeFolder = class BMThemeFolder extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setNodeMinWidth(100)
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeFolder, BMThemeAttribute])
        this.setNodeCanReorderSubnodes(true)
    }

}.initThisClass()
