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
     * @description Initializes the SvDefaultTheme instance.
     * @returns {SvDefaultTheme} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Initializes the prototype slots for the SvDefaultTheme instance.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        this.setupAsDefault() 
    }

    /**
     * @description Sets up the theme as the default theme.
     * @returns {SvDefaultTheme} The current instance.
     * @category Configuration
     */
    setupAsDefault () {
        if (!this.hasSubnodes()) {
            //debugger
            this.setTitle("DefaultTheme")
            const defaultThemeClass = SvThemeClass.clone().setupAsDefault()
            this.addSubnode(defaultThemeClass)
        }
        return this
   }

}.initThisClass());