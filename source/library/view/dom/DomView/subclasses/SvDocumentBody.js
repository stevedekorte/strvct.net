/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvDocumentBody
 * @extends SvDomView
 * @classdesc Represents the document body as a SvDomView.
 */
(class SvDocumentBody extends SvDomView {

    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvDocumentBody.
     * @returns {SvDocumentBody} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        // setup shared devices for later use
        SvDevices.shared().setupIfNeeded();

        //this.documentListener().setIsListening(true)
        if (SvPlatform.isNodePlatform()) {
            console.log("🟡 SvDocumentBody: init: not in browser environment - skipping setIsRegisteredForBrowserDrop");
        } else {
            this.setIsRegisteredForBrowserDrop(true); // to avoid dropping on window
        }

        return this;
    }

    /**
     * @description Handles drop events to prevent dropping on the window.
     * @param {Event} event - The drop event.
     * @returns {boolean} Always returns false to prevent default behavior.
     * @category Event Handling
     */
    acceptsDrop (event) { // to avoid dropping on window
        console.log("SvDocumentBody: acceptsDrop: event:", event.type, "returning false - preventing default to avoid dropping on window");
        event.preventDefault();
        return false;
    }

    /**
     * @description Sets up the element for the SvDocumentBody.
     * @returns {SvDocumentBody} The current instance.
     * @category Initialization
     */
    setupElement () {
        if (SvPlatform.isNodePlatform()) {
            return this;
        }

        //document.body.setDomView(this)
        this._element = document.body;
        this._element.setDomView(this);
        // get this from element override
        return this;
    }

    /**
     * @description Gets the document body element.
     * @returns {HTMLElement} The document body element.
     * @category DOM Interaction
     */
    element () {
        return document.body;
    }

    /**
     * @description Calculates the zoom-adjusted width of the document body.
     * @returns {number} The zoom-adjusted width.
     * @category Layout
     */
    zoomAdjustedWidth () {
        return SvWebBrowserWindow.shared().width() * this.zoomRatio();
    }

    /**
     * @description Calculates the zoom-adjusted height of the document body.
     * @returns {number} The zoom-adjusted height.
     * @category Layout
     */
    zoomAdjustedHeight () {
        return SvWebBrowserWindow.shared().height() * this.zoomRatio();
    }

    /**
     * @description Calculates the zoom-adjusted size of the document body.
     * @returns {Object} An object containing the zoom-adjusted width and height.
     * @category Layout
     */
    zoomAdjustedSize () { // TODO: move to SvPoint
        return { width: this.zoomAdjustedWidth(), height: this.zoomAdjustedHeight() };
    }

    /**
     * @description Gets all DOM elements in the document.
     * @returns {NodeList} A list of all DOM elements.
     * @category DOM Interaction
     */
    allDomElements () {
        const domElements = this.element().getElementsByTagName("*");
        return domElements;
    }

    /**
     * @description Gets all views under a specific point.
     * @param {SvPoint} aPoint - The point to check.
     * @returns {Array} An array of views under the specified point.
     * @category View Management
     */
    viewsUnderPoint (aPoint) {
        const elements = document.elementsFromPoint(aPoint.x(), aPoint.y());
        const views = elements.map(e => this.firstViewForElement(e)).nullsRemoved();
        return views;
    }

    /**
     * @description Finds the first view associated with a given DOM element.
     * @param {HTMLElement} e - The DOM element to start searching from.
     * @returns {SvDomView|null} The first view found, or null if none is found.
     * @category View Management
     */
    firstViewForElement (e) {
        // search up the dom element parents to find one
        // associated with a SvDomView instance

        while (e) {
            const view = e.domView();
            if (view) {
                return view;
            }
            e = e.parentElement;
        }

        return null;
    }


}.initThisClass());
