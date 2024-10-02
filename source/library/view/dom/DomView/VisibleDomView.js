/**
 * @module library.view.dom.DomView
 */

/**
 * @class VisibleDomView
 * @extends ListenerDomView
 * @classdesc Support for visibility events.
 */
(class VisibleDomView extends ListenerDomView {
    
    /**
     * @description Initializes the prototype slots for the VisibleDomView.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} isRegisteredForVisibility
         * @category State
         */
        {
            const slot = this.newSlot("isRegisteredForVisibility", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {IntersectionObserver} intersectionObserver
         * @category Observation
         */
        {
            const slot = this.newSlot("intersectionObserver", null);
            slot.setSlotType("IntersectionObserver");
        }
        /**
         * @member {Function} onVisibilityCallback
         * @category Event Handling
         */
        {
            const slot = this.newSlot("onVisibilityCallback", null);
            slot.setSlotType("Function");
        }
    }

    /**
     * @description Handles the visibility event.
     * @returns {boolean}
     * @category Event Handling
     */
    onVisibility () {
        //this.debugLog(".onVisibility()")
        const callback = this.onVisibilityCallback()
        if (callback) {
            callback()
        }

        this.unregisterForVisibility()
        return true
    }

    /**
     * @description Checks if the view is registered for visibility.
     * @returns {boolean}
     * @category State
     */
    isRegisteredForVisibility () {
        return !Type.isNull(this.intersectionObserver())
    }

    /**
     * @description Sets the registration for visibility.
     * @param {boolean} aBool - Whether to register or unregister for visibility.
     * @returns {VisibleDomView}
     * @category State
     */
    setIsRegisteredForVisibility (aBool) {
        if (aBool !== this.isRegisteredForVisibility()) {
            if (aBool) {
                this.registerForVisibility()
            } else {
                this.unregisterForVisibility()
            }
        }
        return this
    }

    /**
     * @description Unregisters the view from visibility observation.
     * @returns {VisibleDomView}
     * @category Observation
     */
    unregisterForVisibility () {
        const obs = this.intersectionObserver()
        if (obs) {
            obs.disconnect()
            this.setIntersectionObserver(null);
            this._isRegisteredForVisibility = false
        }
        return this
    }

    /**
     * @description Returns the root element for visibility observation.
     * @returns {HTMLElement}
     * @category DOM
     */
    visibilityRoot () {
        // our element must be a decendant of the visibility root element
        let root = document.body

        if (this.parentView()) {
            root = this.parentView().parentView().element() // hack for tile in scroll view - TODO: make more general
            //root = this.parentView().element()
        }
        return root
    }

    /**
     * @description Registers the view for visibility observation.
     * @returns {VisibleDomView}
     * @category Observation
     */
    registerForVisibility () { // this is a oneShot event, as onVisibility() unregisters
        if (this.isRegisteredForVisibility()) {
            return this
        }

        const intersectionObserverOptions = {
            root: this.visibilityRoot(), // watch for visibility in the viewport 
            rootMargin: "0px",
            threshold: 1.0
        }

        const obs = new IntersectionObserver((entries, observer) => {
            EventManager.shared().safeWrapEvent(() => { this.handleIntersection(entries, observer) }, "IntersectionObserverEvent")
            //this.handleIntersection(entries, observer)
        }, intersectionObserverOptions)

        this.setIntersectionObserver(obs);
        obs.observe(this.element());

        this._isRegisteredForVisibility = true
        return this
    }

    /**
     * @description Handles the intersection observation.
     * @param {IntersectionObserverEntry[]} entries - The intersection entries.
     * @param {IntersectionObserver} observer - The intersection observer.
     * @category Event Handling
     */
    handleIntersection (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                //  if (entries[0].intersectionRatio <= 0) return;

                //console.log("onVisibility!")
   
                this.onVisibility()
            }
        })
    }


}.initThisClass());