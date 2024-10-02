/**
 * @module library.view.dom.DomView
 */

"use strict";

/**
 * @class GesturableDomView
 * @extends VisibleDomView
 * @classdesc GesturableDomView class for handling gestures
 */
(class GesturableDomView extends VisibleDomView {
    
    /**
     * @description Initializes the prototype slots for the GesturableDomView
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            // Array - not a map as we might have multiple GRs of same type, but...
            // would it be better to give GRs labels to use for map key?
            // this could replace "default" gesture ivars?
            // Set would make for faster lookup, but we may need to maintain order
            /**
             * @member {Array} gestureRecognizers - Array of gesture recognizers
             * @category Gesture Management
             */
            const slot = this.newSlot("gestureRecognizers", null);
            slot.setSlotType("Array");
        }

        // default gestures with typical settings 
        {
            /**
             * @member {TapGestureRecognizer} defaultTapGesture - Default tap gesture recognizer
             * @category Gesture Management
             */
            const slot = this.newSlot("defaultTapGesture", null);
            slot.setSlotType("TapGestureRecognizer");
        }
        {
            /**
             * @member {TapGestureRecognizer} defaultDoubleTapGesture - Default double tap gesture recognizer
             * @category Gesture Management
             */
            const slot = this.newSlot("defaultDoubleTapGesture", null);
            slot.setSlotType("TapGestureRecognizer");
        }
        {
            /**
             * @member {PanGestureRecognizer} defaultPanGesture - Default pan gesture recognizer
             * @category Gesture Management
             */
            const slot = this.newSlot("defaultPanGesture", null);
            slot.setSlotType("PanGestureRecognizer");
        }
    }

    /**
     * @description Get the gesture recognizers
     * @returns {Array} Array of gesture recognizers
     * @category Gesture Management
     */
    gestureRecognizers () {
        if (this._gestureRecognizers === null) {
            this._gestureRecognizers = [];
        }
        return this._gestureRecognizers;
    }

    /**
     * @description Check if the view has a specific gesture recognizer
     * @param {GestureRecognizer} gr - Gesture recognizer to check
     * @returns {boolean} True if the gesture recognizer exists, false otherwise
     * @category Gesture Management
     */
    hasGestureRecognizer (gr) {
        return this.gestureRecognizers().contains(gr)
    }

    /**
     * @description Add a gesture recognizer to the view
     * @param {GestureRecognizer} gr - Gesture recognizer to add
     * @returns {GestureRecognizer} The added gesture recognizer
     * @category Gesture Management
     */
    addGestureRecognizer (gr) {
        assert(!this.hasGestureRecognizer(gr))
        this.gestureRecognizers().append(gr)
        gr.setViewTarget(this)
        gr.start()
        return gr
    }

    /**
     * @description Remove a gesture recognizer from the view
     * @param {GestureRecognizer} gr - Gesture recognizer to remove
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    removeGestureRecognizer (gr) {
        if (this.gestureRecognizers()) {
            gr.stop()
            gr.setViewTarget(null)
            this.gestureRecognizers().remove(gr)
        }
        return this
    }

    /**
     * @description Remove all gesture recognizers from the view
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    removeAllGestureRecognizers () {
        const grs = this.gestureRecognizers()
        if (grs.length) {
            grs.shallowCopy().forEach(gr => this.removeGestureRecognizer(gr))
        }
        return this
    }

    /**
     * @description Set whether the view has a default tap gesture
     * @param {boolean} aBool - True to add default tap gesture, false to remove it
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    setHasDefaultTapGesture (aBool) {
        if (aBool) {
            this.addDefaultTapGesture()
        } else {
            this.removeDefaultTapGesture()
        }
        return this
    }

    /**
     * @description Add a default tap gesture to the view
     * @returns {TapGestureRecognizer} The default tap gesture recognizer
     * @category Gesture Management
     */
    addDefaultTapGesture () {
        if (!this.defaultTapGesture()) {
            const g = this.addGestureRecognizer(TapGestureRecognizer.clone())
            g.setShouldRequestActivation(true)
            this.setDefaultTapGesture(g)
        }
        return this.defaultTapGesture()
    }

    /**
     * @description Remove the default tap gesture from the view
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    removeDefaultTapGesture () {
        if (this.defaultTapGesture()) {
            this.removeGestureRecognizer(this.defaultTapGesture())
            this.setDefaultTapGesture(null)
        }
        return this
    }

    /**
     * @description Create a new double tap gesture recognizer
     * @returns {TapGestureRecognizer} The new double tap gesture recognizer
     * @private
     * @category Gesture Creation
     */
    newDoubleTapGestureRecognizer () {
        const tg = TapGestureRecognizer.clone();
        tg.setNumberOfTapsRequired(2);
        tg.setNumberOfFingersRequired(1);
        tg.setGestureName("DoubleTap");
        tg.setShouldAcceptCancelRequest(false);
        return tg;
    }

    /**
     * @description Add a default double tap gesture to the view
     * @returns {TapGestureRecognizer} The default double tap gesture recognizer
     * @category Gesture Management
     */
    addDefaultDoubleTapGesture () { 
        if (!this.defaultDoubleTapGesture()) {
            const gr = this.newDoubleTapGestureRecognizer();
            this.setDefaultDoubleTapGesture(gr);
            this.addGestureRecognizer(gr);
        }
        return this.defaultDoubleTapGesture();
    }

    /**
     * @description Remove the default double tap gesture from the view
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    removeDefaultDoubleTapGesture () { 
        if (this.defaultDoubleTapGesture()) {
            this.removeGestureRecognizer(this.defaultDoubleTapGesture());
            this.setDefaultDoubleTapGesture(null);
        }
        return this;
    }

    /**
     * @description Add a default pan gesture to the view
     * @returns {PanGestureRecognizer} The default pan gesture recognizer
     * @category Gesture Management
     */
    addDefaultPanGesture () {
        if (!this._defaultPanGesture) {
            this._defaultPanGesture = this.addGestureRecognizer(PanGestureRecognizer.clone());
        }
        return this._defaultPanGesture;
    }

    /**
     * @description Get the default pan gesture recognizer
     * @returns {PanGestureRecognizer} The default pan gesture recognizer
     * @category Gesture Management
     */
    defaultPanGesture () {
        return this._defaultPanGesture;
    }

    /**
     * @description Remove the default pan gesture from the view
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    removeDefaultPanGesture () {
        if (this._defaultPanGesture) {
            this.removeGestureRecognizer(this._defaultPanGesture);
            this._defaultPanGesture = null;
        }
        return this;
    }

    /**
     * @description Cancel all gestures except the specified one
     * @param {GestureRecognizer} aGesture - The gesture to exclude from cancellation
     * @returns {GesturableDomView} The current instance
     * @category Gesture Management
     */
    cancelAllGesturesExcept (aGesture) {
        this.gestureRecognizers().forEach((gr) => {
            if (gr !== aGesture) {
                gr.cancel()
            }
        })
        return this
    }

}.initThisClass());