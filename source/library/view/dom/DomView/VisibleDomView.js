"use strict";

/*
    VisibleDomView

    Support for visibility events.

*/

(class VisibleDomView extends ListenerDomView {
    
    initPrototype () {
        this.newSlot("isRegisteredForVisibility", false)
        this.newSlot("intersectionObserver", null)
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
        this.unregisterForVisibility()
        return true
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

    registerForVisibility () {
        if (this.isRegisteredForVisibility()) {
            return this
        }

        let root = document.body

        if (this.parentView()) {
            root = this.parentView().parentView().element() // hack for scroll view - TODO: make more general
            //root = this.parentView().element()
        }

        const intersectionObserverOptions = {
            root: root, // watch for visibility in the viewport 
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
                //console.log("onVisibility!")
                if (this._endScrollIntoViewFunc) {
                    this._endScrollIntoViewFunc()
                    // hack around lack of end of scrollIntoView event 
                    // needed to return focus that scrollIntoView grabs from other elements
                }
                this.onVisibility()
            }
        })
    }


}.initThisClass());
