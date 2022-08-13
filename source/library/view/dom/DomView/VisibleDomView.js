"use strict";

/*
    VisibleDomView

    Support for visibility events.

*/

(class VisibleDomView extends ListenerDomView {
    
    initPrototype () {
        this.newSlot("isRegisteredForVisibility", false)
        this.newSlot("intersectionObserver", null)
        this.newSlot("onVisibilityCallback", null)
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // visibility event

    onVisibility () {
        //this.debugLog(".onVisibility()")
        const callback = this.onVisibilityCallback()
        if (callback) {
            callback()

        }

        this.unregisterForVisibility()
        return true
    }

    isRegisteredForVisibility () {
        return !Type.isNull(this.intersectionObserver())
    }

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

    unregisterForVisibility () {
        const obs = this.intersectionObserver()
        if (obs) {
            obs.disconnect()
            this.setIntersectionObserver(null);
            this._isRegisteredForVisibility = false
        }
        return this
    }

    visibilityRoot () {
        // our element must be a decendant of the visibility root element
        let root = document.body

        if (this.parentView()) {
            root = this.parentView().parentView().element() // hack for tile in scroll view - TODO: make more general
            //root = this.parentView().element()
        }
        return root
    }

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
            EventManager.shared().safeWrapEvent(() => { this.handleIntersection(entries, observer) })
            //this.handleIntersection(entries, observer)
        }, intersectionObserverOptions)

        this.setIntersectionObserver(obs);
        obs.observe(this.element());

        this._isRegisteredForVisibility = true
        return this
    }

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
