/**
 * @module library.resources.themes
 */

/**
 * @class SvDefaultTheme
 * @extends SvTheme
 * @classdesc Represents the default theme for the application.
 */
(class SvDefaultTheme extends SvTheme {

    /**
     * @static
     * @description The version of the built-in default theme values. Bump
     * this when the setupAsDefault* values change (SvThemeState defaults,
     * theme class structure) — the theme tree is STORED, so without a bump
     * existing stores keep the old values forever and only fresh stores see
     * the new defaults. Bumping rebuilds the default theme on next load
     * (discarding any inspector customizations of it).
     * @returns {number} The defaults version.
     * @category Versioning
     */
    static defaultsVersion () {
        // 2: state colors express --sv-* token indirection
        // 3: token colors admitted to validColors — v2's rebuild had them
        //    coerced back to "inherit" by options-field validation, leaving
        //    the selected state styleless in every theme
        // 4: SvTheme gained token folders as subnodes (Plans/Theme
        //    Environment Stage 3); theme classes are now filtered by class
        return 4;
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {number} setupVersion - defaultsVersion at last setup.
         * @category Versioning
         */
        {
            const slot = this.newSlot("setupVersion", 0);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvDefaultTheme instance.
     * @returns {SvDefaultTheme} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Initializes the prototype slots for the SvDefaultTheme instance.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        if (this.setupVersion() !== this.thisClass().defaultsVersion()) {
            this.removeThemeClasses(); // stale stored defaults — rebuild below (token folders are slots, untouched)
        }
        this.setupAsDefault();
    }

    /**
     * @description Sets up the theme as the default theme.
     * @returns {SvDefaultTheme} The current instance.
     * @category Configuration
     */
    setupAsDefault () {
        if (this.themeClasses().length === 0) {
            //debugger
            this.setTitle("DefaultTheme");
            const defaultThemeClass = SvThemeClass.clone().setupAsDefault();
            this.addSubnode(defaultThemeClass);
            this.setSetupVersion(this.thisClass().defaultsVersion());
        }
        return this;
    }

}.initThisClass());
