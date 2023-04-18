"use strict";

/*

    BMThemeLeveledFolder

*/

(class BMThemeLeveledFolder extends BMThemeFolder {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setNodeCanEditTitle(true)
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeLevelClass])
        this.setNodeCanReorderSubnodes(true)
    }

    onDidReorderSubnodes () {
        this.subnodes().forEach(sn => sn.updateTitle())
        return this
    }

}.initThisClass());
