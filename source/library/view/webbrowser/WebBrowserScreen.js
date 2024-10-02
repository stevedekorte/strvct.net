/**
 * @module library.view.webbrowser
 */

/**
 * @class WebBrowserScreen
 * @extends ProtoClass
 * @classdesc Represents the screen in a web browser environment.
 */
(class WebBrowserScreen extends ProtoClass {
    
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the WebBrowserScreen instance.
     * @category Initialization
     */
    init () {
        assert(!this.thisClass().hasShared()) // enforce singleton
        super.init()
    }

    /**
     * @description Gets the width of the screen.
     * @returns {number} The width of the screen.
     * @category Dimensions
     */
    width () {
        return screen.width
    }

    /**
     * @description Gets the height of the screen.
     * @returns {number} The height of the screen.
     * @category Dimensions
     */
    height () {
        return screen.height
    }
    
    /**
     * @description Calculates the aspect ratio of the screen.
     * @returns {number} The aspect ratio of the screen.
     * @category Dimensions
     */
    aspectRatio () {
        return this.width() / this.height()
    }
    
    /**
     * @description Checks if the screen is rotated (only works on mobile).
     * @returns {boolean} True if the screen is rotated, false otherwise.
     * @category Orientation
     */
    isRotated () { // screen aspect doesn't match window (only works on mobile)
        const a = this.aspectRatio() > 1 
        const b = WebBrowserWindow.shared().aspectRatio() > 1
        return a !== b && WebBrowserWindow.shared().isOnMobile()
    }
    
    /**
     * @description Gets the oriented width of the screen.
     * @returns {number} The oriented width of the screen.
     * @category Dimensions
     */
    orientedWidth () {
        return this.isRotated() ? this.height() : this.width()
    }
    
    /**
     * @description Gets the oriented height of the screen.
     * @returns {number} The oriented height of the screen.
     * @category Dimensions
     */
    orientedHeight () {
        return this.isRotated() ? this.width() : this.height()
    }
        
    /**
     * @description Displays information about the screen size.
     * @category Debugging
     */
    show () {
        this.debugLog(" size " + this.width() + "x" + this.height())
    }

    /**
     * @description Gets the lesser of window and oriented screen size.
     * @returns {Object} An object containing the width and height.
     * @category Dimensions
     */
    lesserOrientedSize () {
        // lesser of window and oriented screen size
        const w = Math.min(this.orientedWidth(), WebBrowserWindow.shared().width())
        const h = Math.min(this.orientedHeight(), WebBrowserWindow.shared().height())
        return { width: w, height: h }
    }

    /**
     * @description Checks if the user prefers dark mode.
     * @returns {boolean} True if the user prefers dark mode, false otherwise.
     * @category User Preferences
     */
    userPrefersDarkMode () {
        // should we add a timer to monitor this value and post notifications on changes?
        // how about an NoteMonitor object that does this? example:
        // const m = NoteMonitor.clone().setTarget(this).setMethod("userPrefersDarkMode")
        // m.setName("didChangeDarkMode").setPeriodInSeconds(1).start()
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark
    }

}.initThisClass());