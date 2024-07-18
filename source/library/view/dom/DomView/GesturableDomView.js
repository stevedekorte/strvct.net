"use strict";

/*
    GesturableDomView

    Handling gestures
    
*/

(class GesturableDomView extends VisibleDomView {
    
    initPrototypeSlots () {
        // Array - not a map as we might have multiple GRs of same type, but...
        // would it be better to give GRs labels to use for map key?
        // this could replace "default" gesture ivars?
        {
            const slot = this.newSlot("gestureRecognizers", null); // array
            slot.setSlotType("Array");
        }

        // default gestures with typical settings 
        {
            const slot = this.newSlot("defaultTapGesture", null);
            slot.setSlotType("TapGestureRecognizer");
        }
        {
            const slot = this.newSlot("defaultDoubleTapGesture", null);
            slot.setSlotType("TapGestureRecognizer");
        }
        {
            const slot = this.newSlot("defaultPanGesture", null);
            slot.setSlotType("PanGestureRecognizer");
        }
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // gestures

    gestureRecognizers () {
        if (this._gestureRecognizers === null) {
            this._gestureRecognizers = []
        }
        return this._gestureRecognizers
    }

    /*

    // deprecated - GestureRecognizers are now used instead of direct touch events

    isRegisteredForTouch () {
        return this.touchListener().isListening()
    }

    setIsRegisteredForTouch (aBool) {
        this.touchListener().setIsListening(aBool)

        if (aBool) {
            this.setTouchAction("none") // testing
        }

        return this
    }

    onTouchStart (event) {
    }

    onTouchMove (event) {
    }

    onTouchCancel (event) {
    }

    onTouchEnd (event) {
    }
    */

    // --- GestureRecognizers ---

    hasGestureRecognizer (gr) {
        return this.gestureRecognizers().contains(gr)
    }

    addGestureRecognizer (gr) {
        assert(!this.hasGestureRecognizer(gr))
        this.gestureRecognizers().append(gr)
        gr.setViewTarget(this)
        gr.start()
        //console.log(this.typeId() + " addGestureRecognizer(" + gr.type() + ")")
        return gr
    }

    removeGestureRecognizer (gr) {
        if (this.gestureRecognizers()) {
            gr.stop()
            gr.setViewTarget(null)
            this.gestureRecognizers().remove(gr)
        }
        return this
    }

    /*
    hasGestureType (typeName) {
        return this.gesturesOfType(typeName).length > 0
    }

    addGestureRecognizerIfAbsent (gr) {
        if (!this.hasGestureRecognizer(gr)) {
            this.addGestureRecognizer(gr)
        }
        return this
    }
    
    gesturesOfType (typeName) {
        return this.gestureRecognizers().select(gr => gr.type() == typeName)
    }

    removeGestureRecognizersOfType (typeName) {
        if (this.gestureRecognizers()) {
            this.gestureRecognizers().select(gr => gr.type() == typeName).forEach(gr => this.removeGestureRecognizer(gr))
        }
        return this
    }
    */

    removeAllGestureRecognizers () {
        const grs = this.gestureRecognizers()
        if (grs.length) {
            //console.log(this.typeId() + " removeAllGestureRecognizers ", grs.length)
            grs.shallowCopy().forEach(gr => this.removeGestureRecognizer(gr))
        }
        return this
    }

    // default tap gesture

    setHasDefaultTapGesture (aBool) {
        if (aBool) {
            this.addDefaultTapGesture()
        } else {
            this.removeDefaultTapGesture()
        }
        return this
    }

    addDefaultTapGesture () {
        if (!this.defaultTapGesture()) {
            const g = this.addGestureRecognizer(TapGestureRecognizer.clone())
            g.setShouldRequestActivation(true) // TODO: this is usually what we want?
            this.setDefaultTapGesture(g)
        }
        return this.defaultTapGesture()
    }

    removeDefaultTapGesture () {
        if (this.defaultTapGesture()) {
            this.removeGestureRecognizer(this.defaultTapGesture())
            this.setDefaultTapGesture(null)
        }
        return this
    }

    // default double tap gesture

    newDoubleTapGestureRecognizer () { // private
        const tg = TapGestureRecognizer.clone();
        tg.setNumberOfTapsRequired(2);
        tg.setNumberOfFingersRequired(1);
        tg.setGestureName("DoubleTap");

        // Do we want this, which allows single tap event and double tap, or do
        // we want to wait to send single tap until double tap wait period expires?
        tg.setShouldAcceptCancelRequest(false); // so single click doesn't cancel double click. 
        return tg;
    }

    addDefaultDoubleTapGesture () { 
        if (!this.defaultDoubleTapGesture()) {
            const gr = this.newDoubleTapGestureRecognizer();
            this.setDefaultDoubleTapGesture(gr);
            this.addGestureRecognizer(gr);
        }
        return this.defaultDoubleTapGesture();
    }

    removeDefaultDoubleTapGesture () { 
        if (this.defaultDoubleTapGesture()) {
            this.removeGestureRecognizer(this.defaultDoubleTapGesture());
            this.setDefaultDoubleTapGesture(null);
        }
        return this;
    }

    // default pan gesture

    addDefaultPanGesture () {
        if (!this._defaultPanGesture) {
            this._defaultPanGesture = this.addGestureRecognizer(PanGestureRecognizer.clone());
        }
        return this._defaultPanGesture;
    }

    defaultPanGesture () {
        return this._defaultPanGesture;
    }

    removeDefaultPanGesture () {
        if (this._defaultPanGesture) {
            this.removeGestureRecognizer(this._defaultPanGesture);
            this._defaultPanGesture = null;
        }
        return this;
    }

    // orient testing

    /*
    onOrientBegin (aGesture) {
        this.debugLog(".onOrientBegin()")
        aGesture.show()
    }

    onOrientMove (aGesture) {
        this.debugLog(".onOrientMove()")
        aGesture.show()
    }

    onOrientComplete (aGesture) {
        this.debugLog(".onOrientComplete()")
        aGesture.show()
    }
    */

    cancelAllGesturesExcept (aGesture) {
        this.gestureRecognizers().forEach((gr) => {
            //if (gr.type() !== aGesture.type()) {
            if (gr !== aGesture) {
                //this.debugLog("cancelling gesture ", gr.type())
                gr.cancel()
            }
        })
        return this
    }


}.initThisClass());
