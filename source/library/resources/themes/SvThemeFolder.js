"use strict";

/**
 * @module library.resources.themes
 */

/**
 * @class SvThemeFolder
 * @extends SvStorableNode
 * @classdesc Represents a folder for organizing themes in the application.
 */
(class SvThemeFolder extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the SvThemeFolder class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the SvThemeFolder class.
     * @category Initialization
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
     * @description Initializes a new instance of the SvThemeFolder class.
     * @returns {SvThemeFolder} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setSubnodeClasses([this.thisClass(), SvThemeClass, SvStringField, SvNumberField]);
        return this;
    }

    /**
     * @description Generates a style map for the theme folder.
     * @returns {Map} A map containing the styles for the theme folder and its subnodes.
     * @category Styling
     */
    styleMap () {
        // this should be the same implementation of styleMap() as SvThemeClass
        const map = new Map();
        const title = this.title();
        this.subnodes().forEach(sn => {
            sn.styleMap().forEachKV((k, v) => {
                map.set(title + "." + k, v);
            });
        });
        return map;
    }

}.initThisClass());
