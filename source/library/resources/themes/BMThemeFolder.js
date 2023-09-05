"use strict";

/*

    BMThemeFolder

*/

(class BMThemeFolder extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setCanDelete(true)
        this.addNodeAction("add")
        this.setSubnodeClasses([BMThemeFolder, BMThemeClass, BMStringField, BMNumberField])
        this.setNodeCanReorderSubnodes(true)
    }

    styleMap () {
        // this should be the same implementation of styleMap() as BMThemeClass
        const map = new Map()
        const title = this.title()
        this.subnodes().forEach(sn => { 
            sn.styleMap().forEachKV((k, v) => {
              map.set(title + "." + k, v)
            })
        })
        return map
    }

}.initThisClass());
