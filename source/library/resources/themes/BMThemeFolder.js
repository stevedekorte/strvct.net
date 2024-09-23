"use strict";

/**
 * @module library.resources.themes.BMThemeFolder
 */

/**
 * @class BMThemeFolder
 * @extends BMStorableNode
 * @classdesc Represents a folder for organizing themes in the application.
 */
(class BMThemeFolder extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the BMThemeFolder class.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the BMThemeFolder class.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        
        this.setNodeCanEditTitle(true);
        this.setTitle("Untitled " + this.thisClass().visibleClassName());
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
     * @description Initializes a new instance of the BMThemeFolder class.
     * @returns {BMThemeFolder} The initialized instance.
     */
    init () {
        super.init();
        this.setSubnodeClasses([this.thisClass(), BMThemeClass, BMStringField, BMNumberField]);
        return this;
    }

    /**
     * @description Generates a style map for the theme folder.
     * @returns {Map} A map containing the styles for the theme folder and its subnodes.
     */
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