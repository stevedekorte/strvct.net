"use strict";

/*

    BMThemeFolder

*/

(class BMThemeFolder extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeFolder, BMThemeClass, BMStringField, BMNumberField])
        this.setNodeCanReorderSubnodes(true)
    }

}.initThisClass());
