/**
 * @module library.view.dom.DomView
 */

/**
 * @class DomView_animations
 * @extends DomView
 * @classdesc Helper methods for animations.
 */
(class DomView_animations extends DomView {

    /**
     * @description Immediately scrolls the view to the bottom.
     * @returns {DomView_animations} The instance of the class.
     */
    immediatelyScrollToBottom () {
        const focusedElement = document.activeElement
        const needsRefocus = focusedElement !== this.element()
        // console.log("]]]]]]]]]]]] " + this.typeId() + ".scrollToTop() needsRefocus = ", needsRefocus)

        //this.setScrollTop(this.scrollHeight() + "px")
        this.element().scrollTop = this.element().scrollHeight;

        //if (needsRefocus) {
        if (focusedElement !== document.activeElement) {
            focusedElement.focus();
        }
        //e.animate({ scrollTop: offset }, 500); // TODO: why doesn't this work?
        return this;
    }

    /**
     * @description Scrolls the view to the bottom.
     * @returns {DomView_animations} The instance of the class.
     */
    scrollToBottom () {
        this.immediatelyScrollToBottom();
        return this;
    }

    /**
     * @description Scrolls a subview to the top of the view.
     * @param {DomView} aSubview - The subview to scroll to the top.
     * @returns {DomView_animations} The instance of the class.
     */
    scrollSubviewToTop (aSubview) {
        console.log("]]]]]]]]]]]] " + this.typeId() + ".scrollSubviewToTop()")
        assert(this.hasSubview(aSubview))
        //this.setScrollTop(aSubview.offsetTop())
        //this.setScrollTopSmooth(aSubview.offsetTop())
        //this.setScrollTop(aSubview.offsetTop() + aSubview.scrollHeight())
        this.animateValue(
            () => { return aSubview.offsetTop() },
            () => { return this.scrollTop() },
            (v) => { this.setScrollTop(v) },
            200)
        return this
    }

    /**
     * @description Animates a value over a specified duration.
     * @param {Function} targetFunc - Function that returns the target value.
     * @param {Function} valueFunc - Function that returns the current value.
     * @param {Function} setterFunc - Function to set the new value.
     * @param {number} duration - Duration of the animation in milliseconds.
     * @returns {DomView_animations} The instance of the class.
     */
    animateValue (targetFunc, valueFunc, setterFunc, duration) { // duration in milliseconds         
        console.log("]]]]]]]]]]]] " + this.typeId() + ".animateValue()")
        if (duration == null) {
            duration = 200
        }
        //duration = 1500
        const startTime = Date.now();

        const step = () => {
            const dt = (Date.now() - startTime)
            let r = dt / duration
            r = Math.sin(r * Math.PI / 2)
            r = r * r * r

            const currentValue = valueFunc()
            const currentTargetValue = targetFunc()

            //console.log("time: ", dt, " /", duration, " r:", r, " top:", currentValue, "/", currentTargetValue)

            if (dt > duration) {
                setterFunc(currentTargetValue)
            } else {
                const newValue = currentValue + (currentTargetValue - currentValue) * r
                setterFunc(newValue)
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
        return this
    }

    /**
     * @description Sets the scroll top smoothly.
     * @param {number} newScrollTop - The new scroll top position.
     * @param {number} scrollDuration - The duration of the scroll animation.
     * @returns {DomView_animations} The instance of the class.
     */
    setScrollTopSmooth (newScrollTop, scrollDuration) {
        this.animateValue(() => { return newScrollTop }, () => { return this.scrollTop() }, (v) => { this.setScrollTop(v) }, scrollDuration)
        return this
    }

    /**
     * @description Dynamically scrolls the view into view within its parent view.
     * @returns {DomView_animations} The instance of the class.
     */
    dynamicScrollIntoView () {
        this.parentView().scrollSubviewToTop(this)
        return this
    }

    /**
     * @description Scrolls the view into view.
     * @returns {boolean|DomView_animations} False if already in view, otherwise the instance of the class.
     */
    scrollIntoView () {
        // TODO: return immediately if already visible
        if (this.isScrolledIntoView()) {
            return false
        }

        const focusedView = WebBrowserWindow.shared().activeDomView()
        //console.log("]]]]]]]]]]]] " + this.typeId() + ".scrollIntoView() needsRefocus = ", focusedView !== this)

        // if another view is focused, the scrolling will unfocus it, so we
        // need a way to return focus after scrolling is complete
        if (focusedView && focusedView !== this) {
            //console.log("scrollIntoView - registerForVisibility")
            // this hack is needed to return focus that scrollIntoView grabs from other elements
            // need to do this before element().scrollIntoView appearently
            this.registerForVisibility()
            // hack around lack of end of scrollIntoView event 
            // needed to return focus that scrollIntoView grabs from other elements
            this.setOnVisibilityCallback(() => {
                //console.log("_endScrollIntoViewFunc - returning focus")
                //focusedView.focus()
                // need delay to allow scroll to finish - hack - TODO: check for full visibility
                focusedView.focusAfterDelay(0.2)
            })
        }

        this.addTimeout(() => {
            // have browser do scroll
            //ThrashDetector.shared().didOp("scrollIntoView")
            this.element().scrollIntoView({ 
                block: "start", 
                inline: "nearest", 
                behavior: this.usesSmoothScrolling() ? "smooth" : "auto", 
            })
        }, 0)

        this.element().addEventListener('transitionend', (transitionEvent) => {
            console.log("completed scrollIntoView transition?:", transitionEvent.propertyName)
        });

        /*
        if (focusedView !== this) {
            focusedView.focusAfterDelay(0.5) // TODO: get this value from transition property
        }
        */
        return this
    }
    
    /**
     * @description Checks if the view is scrolled into view.
     * @returns {boolean} True if the view is visible, false otherwise.
     */
    isScrolledIntoView () {
        const r = this.boundingClientRect()
        const isVisible = (r.top >= 0) && (r.bottom <= window.innerHeight);
        return isVisible;
    }

    /**
     * @description Vertically aligns the view absolutely within its parent view.
     * @returns {DomView_animations} The instance of the class.
     */
    verticallyAlignAbsoluteNow () {
        const pv = this.parentView()
        if (pv) {
            this.setPosition("absolute")
            const parentHeight = pv.computedHeight() //pv.calcHeight() // computedHeight?
            const height = this.computedHeight()
            this.setTopPx((parentHeight / 2) - (height / 2))
        } else {
            throw new Error("missing parentView")
        }
        return this
    }

    /**
     * @description Horizontally aligns the view absolutely within its parent view.
     * @returns {DomView_animations} The instance of the class.
     */
    horizontallyAlignAbsoluteNow () {
        const pv = this.parentView()
        if (pv) {
            this.setPosition("absolute")
            this.addTimeout(() => {
                this.setRightPx(pv.clientWidth() / 2 - this.clientWidth() / 2)
            }, 0)
        }
        return this
    }

    /**
     * @description Animates the view to a specified document frame.
     * @param {Object} destinationFrame - The destination frame.
     * @param {number} seconds - The duration of the animation in seconds.
     * @param {Function} completionCallback - The callback to be called after animation completes.
     * @returns {DomView_animations} The instance of the class.
     */
    animateToDocumentFrame (destinationFrame, seconds, completionCallback) {
        this.setTransition("all " + seconds + "s")
        assert(this.position() === "absolute")
        this.addTimeout(() => {
            this.setTopPx(destinationFrame.origin().y())
            this.setLeftPx(destinationFrame.origin().x())
            this.setMinAndMaxWidth(destinationFrame.size().width())
            this.setMinAndMaxHeight(destinationFrame.size().height())
        }, 0)

        this.addTimeout(() => {
            completionCallback()
        }, seconds * 1000)
        return this
    }

    /**
     * @description Animates the view to a specified document point.
     * @param {Object} destinationPoint - The destination point.
     * @param {number} seconds - The duration of the animation in seconds.
     * @param {Function} completionCallback - The callback to be called after animation completes.
     * @returns {DomView_animations} The instance of the class.
     */
    animateToDocumentPoint (destinationPoint, seconds, completionCallback) {
        this.setTransition("all " + seconds + "s")
        assert(this.position() === "absolute")
        this.addTimeout(() => {
            this.setTopPx(destinationPoint.y())
            this.setLeftPx(destinationPoint.x())
        }, 0)

        this.addTimeout(() => {
            completionCallback()
        }, seconds * 1000)
        return this
    }

    /**
     * @description Hides the view and fades it in.
     * @returns {DomView_animations} The instance of the class.
     */
    hideAndFadeIn () {
        this.setOpacity(0)
        //this.setTransition("all 0.5s")
        this.addTimeout(() => {
            this.setOpacity(1)
        }, 0)
    }

    /**
     * @description Fades in the view to display as inline-block.
     * @returns {DomView_animations} The instance of the class.
     */
    fadeInToDisplayInlineBlock () {
        this.transitions().at("opacity").updateDuration("0.3s")
        this.setDisplay("inline-block")
        this.setOpacity(0)
        this.addTimeout(() => {
            this.setOpacity(1)
        }, 0)
        return this
    }

    /**
     * @description Fades out the view to display none.
     * @returns {DomView_animations} The instance of the class.
     */
    fadeOutToDisplayNone () {
        this.transitions().at("opacity").updateDuration("0.3s")
        this.setOpacity(0)
        this.addTimeout(() => {
            this.setDisplay("none")
        }, 200)
        return this
    }

    /**
     * @description Fades in the view's height to display as block.
     * @returns {DomView_animations} The instance of the class.
     */
    fadeInHeightToDisplayBlock () {
        this.setDisplay("block")
        this.setOpacity(1)
        this.setMinHeight("100%")
        this.setMaxHeight("100%")
        return this
/*
        this.setMinHeight("100%")
        this.setMaxHeight("100%")
        const targetHeight = this.calcHeight()

        this.setOverflow("hidden")
        this.transitions().at("opacity").updateDuration("0.3s")
        this.transitions().at("min-height").updateDuration("0.2s")
        this.transitions().at("max-height").updateDuration("0.2s")

        this.setDisplay("block")
        this.setOpacity(0)
        this.setMinAndMaxHeight(0)

        this.addTimeout(() => {
            this.setOpacity(1)
            this.setMinAndMaxHeight(targetHeight)
        }, 0)
        */
        return this
    }

    /**
     * @description Fades out the view's height to display none.
     * @returns {DomView_animations} The instance of the class.
     */
    fadeOutHeightToDisplayNone () {
        this.setOverflow("hidden")
        this.transitions().at("opacity").updateDuration("0.2s")
        this.transitions().at("min-height").updateDuration("0.3s")
        this.transitions().at("max-height").updateDuration("0.3s")

        this.addTimeout(() => {
            this.setOpacity(0)
            this.setMinAndMaxHeight(0)
        }, 1)

        /*
        this.addTimeout(() => {
            this.setDisplay("none")
        }, 300)
        */
        return this
    }


}.initThisCategory());