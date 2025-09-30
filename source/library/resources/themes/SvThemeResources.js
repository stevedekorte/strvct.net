/**
 * @module library.resources.themes
 */

"use strict";

/**
 * @class SvThemeResources
 * @extends SvStorableNode
 * @classdesc
 * SvThemeResources
 *
 * hierarchy:
 *
 *     SvThemeResources -> Theme -> ThemeClass -> ThemeState -> ThemeAttribute
 *
 * example:
 *
 *     global           -> "Dark" -> "Field"   -> "active"   -> "opacity" : "0.5"
 *
 * Example use by views:
 *
 *     SvThemeResources.shared().currentTheme().classNamed("x").attributeNamed("y").value()
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
(class SvThemeResources extends SvStorableNode {

    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

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
        this.setTitle("Themes");

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);

        this.setNoteIsSubnodeCount(true);
        this.setNodeCanAddSubnode(true);
        this.setSubnodeClasses([SvTheme, SvDefaultTheme]);
        this.setNodeCanReorderSubnodes(true);

        //this.setSubnodes([SvDefaultTheme.clone()]) // hack
    }

    /**
     * @description Performs final initialization, adding a default theme if no subnodes exist.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        if (!this.hasSubnodes()) {
            this.addSubnode(SvDefaultTheme.clone()); // hack
        }
    }

    /**
     * @description Returns the active theme.
     * @returns {SvTheme} The first subnode, which is considered the active theme.
     * @category Theme Management
     */
    activeTheme () {
        return this.subnodes().first();
    }

    /**
     * @description Returns the default theme class.
     * @returns {ThemeClass} The first subnode of the active theme.
     * @category Theme Management
     */
    defaultThemeClass () {
        return this.activeTheme().subnodes().first();
    }

}.initThisClass());
