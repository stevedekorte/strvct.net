"use strict";

/*

    BMThemeFolder

*/

(class BMThemeFolder extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        
        this.setNodeCanEditTitle(true);
        this.setTitle("Untitled " + this.thisClass().visibleClassName());
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    init () {
        super.init();
        this.setSubnodeClasses([this.thisClass(), BMThemeClass, BMStringField, BMNumberField]);
        return this;
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
