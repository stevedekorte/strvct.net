/**
 * @module library.resources.themes.BMThemeResources
 */

"use strict";

/**
 * @class BMThemeResources
 * @extends BMStorableNode
 * @classdesc
 * BMThemeResources
 *
 * hierarchy:
 *
 *     BMThemeResources -> Theme -> ThemeClass -> ThemeState -> ThemeAttribute
 *
 * example:
 * 
 *     global           -> "Dark" -> "Field"   -> "active"   -> "opacity" : "0.5"
 *
 * Example use by views:
 *
 *     BMThemeResources.shared().currentTheme().classNamed("x").attributeNamed("y").value()
 *
 * We'd like to implement some form  of inheritance system.
 * Example:
 *
 * The ThemeClass "FieldValue" has a "unselected" ThemeState, but no "active" ThemeState, 
 * so we default to the "unselected" ThemeState.
 *
 * Should ThemeClass implement a defaultSubnode() method for failed lookups?
 * Should it ask subnodes isDefault()? 
 */
(class BMThemeResources extends BMStorableNode {
    
    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     */
    static initClass () {
        this.setIsSingleton(true)
    }

    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default settings.
     */
    initPrototype () {
        this.setTitle("Themes")

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setNoteIsSubnodeCount(true)
        this.setNodeCanAddSubnode(true)
        this.setSubnodeClasses([BMTheme, BMDefaultTheme])
        this.setNodeCanReorderSubnodes(true)

        //this.setSubnodes([BMDefaultTheme.clone()]) // hack
    }

    /**
     * @description Performs final initialization, adding a default theme if no subnodes exist.
     */
    finalInit () {
        super.finalInit();
        if (!this.hasSubnodes()) {
            this.addSubnode(BMDefaultTheme.clone()) // hack
        }
    }

    /**
     * @description Returns the active theme.
     * @returns {BMTheme} The first subnode, which is considered the active theme.
     */
    activeTheme () {
        return this.subnodes().first()
    }

    /**
     * @description Returns the default theme class.
     * @returns {ThemeClass} The first subnode of the active theme.
     */
    defaultThemeClass () {
        return this.activeTheme().subnodes().first()
    }
    
}.initThisClass());