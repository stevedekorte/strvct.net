/**
 * @module library.resources.themes
 */

/**
 * @class BMDefaultTheme
 * @extends BMTheme
 * @classdesc Represents the default theme for the application.
 */
(class BMDefaultTheme extends BMTheme {

    /**
     * @description Initializes the BMDefaultTheme instance.
     * @returns {BMDefaultTheme} The initialized instance.
     */
    init() {
        super.init()
        return this
    }

    /**
     * @description Performs final initialization steps for the BMDefaultTheme instance.
     */
    finalInit() {
        super.finalInit();
        this.setupAsDefault() 
    }

    /**
     * @description Sets up the theme as the default theme.
     * @returns {BMDefaultTheme} The current instance.
     */
    setupAsDefault() {
        if (!this.hasSubnodes()) {
            //debugger
            this.setTitle("DefaultTheme")
            const defaultThemeClass = BMThemeClass.clone().setupAsDefault()
            this.addSubnode(defaultThemeClass)
        }
        return this
   }

}.initThisClass());