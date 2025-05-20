"use strict";

/**
 * @module library.resources.themes
 */

/**
 * @class SvThemeClassChildren
 * @extends SvThemeFolder
 * @classdesc Represents a folder for theme class children.
 */
(class SvThemeClassChildren extends SvThemeFolder {
    
    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        this.setNodeCanEditTitle(true)
        this.setTitle("children")
        this.setCanDelete(true)
        this.setNodeCanAddSubnode(true)
        this.setSubnodeClasses([SvThemeClass])
        this.setNodeCanReorderSubnodes(true)
    }

    /**
     * @description Finds a theme class by its name.
     * @param {string} name - The name of the theme class to find.
     * @returns {SvThemeClass|undefined} The found theme class or undefined if not found.
     * @category Search
     */
    themeClassNamed (name) {
        return this.subnodes().detect(sn => sn.title() === name)
    }

}.initThisClass());