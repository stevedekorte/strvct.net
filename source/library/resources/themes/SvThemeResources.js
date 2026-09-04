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
        /**
         * @member {SvTheme|null} displayedTheme - the theme whose TOKENS the UI
         * is currently wearing (Plans/Theme Environment Stage 4). Set by the
         * UI layer from navigation, never stored: which theme shows is a fact
         * about the current session of use, not about the resources.
         *
         * Distinct from activeTheme(), which supplies the SvThemeClass tree of
         * per-state tile styles and stays the default theme.
         * @category Theme Management
         */
        {
            const slot = this.newSlot("displayedTheme", null);
            slot.setSlotType("SvTheme");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
        }
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
        // The default theme owns the SvThemeClass tree every tile styles from;
        // seeded token themes (Classic, Parchment, …) sit beside it and must
        // never be mistaken for it whatever the stored order.
        return this.subnodes().detect(t => t.isKindOf(SvDefaultTheme)) || this.subnodes().first();
    }

    /**
     * @description Returns the default theme class.
     * @returns {ThemeClass} The first theme class of the active theme.
     * @category Theme Management
     */
    defaultThemeClass () {
        return this.activeTheme().themeClasses().first();
    }

    /**
     * @description The stored theme with this title, or null.
     * @param {String} name
     * @returns {SvTheme|null}
     * @category Theme Management
     */
    themeNamed (name) {
        return this.subnodes().detect(t => t.title() === name) || null;
    }

    /**
     * @description Titles of every stored theme — what a "default theme"
     * picker offers.
     * @returns {String[]}
     * @category Theme Management
     */
    themeNames () {
        // the default theme holds only the shared per-state styles; it is not
        // a look a user can choose
        return this.subnodes().filter(t => !t.isKindOf(SvDefaultTheme)).map(t => t.title());
    }

    /**
     * @description The theme with this title, created (as a plain SvTheme)
     * if absent. Used to seed built-in themes.
     * @param {String} name
     * @returns {SvTheme}
     * @category Theme Management
     */
    themeNamedIfAbsentInsert (name) {
        let theme = this.themeNamed(name);
        if (!theme) {
            theme = SvTheme.clone().setTitle(name);
            this.addSubnode(theme);
        }
        return theme;
    }

}.initThisClass());
