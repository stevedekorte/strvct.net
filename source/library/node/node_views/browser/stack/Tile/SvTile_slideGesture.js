/**
 * @module browser.stack.SvTile
 */

"use strict";

/**
 * @class SvTile_slideGesture
 * @extends SvTile
 * @classdesc Extends SvTile functionality with slide gesture capabilities for deletion.
 */
(class SvTile_slideGesture extends SvTile {

    /**
     * @description Checks if the tile accepts slide gestures.
     * @returns {boolean} True if the tile can be deleted, false otherwise.
     * @category Gesture
     */
    acceptsSlide () {
        return this.canDelete();
    }

    /**
     * @description Initializes the slide gesture.
     * @returns {SvTile_slideGesture} The current instance.
     * @category Gesture
     */
    onSlideBegin () {
        this.setSlideDeleteOffset(this.clientWidth() * 0.5);
        this.contentView().setTransition("all 0s");
        this.setupSlide();
        return this;
    }

    /**
     * @description Returns the color of the view under the content.
     * @returns {string} The color value.
     * @category Appearance
     */
    underContentViewColor () {
        return "black";
    }

    /**
     * @description Sets up the slide gesture elements.
     * @returns {SvTile_slideGesture} The current instance.
     * @category Gesture
     */
    setupSlide () {
        if (!this.dragDeleteButtonView()) {
            //const h = this.clientHeight()

            this.element().style.backgroundColor = this.underContentViewColor();
            const cb = SvCloseButton.clone().setOpacity(0).setTransition("opacity 0.1s").setPosition("absolute");
            this.addSubview(cb);

            const size = 10;
            cb.setMinAndMaxWidthAndHeight(size);
            cb.verticallyAlignAbsoluteNow();
            cb.setRightPx(size * 2);
            cb.setZIndex(0);
            this.setDragDeleteButtonView(cb);
        }
        return this;
    }

    /**
     * @description Cleans up the slide gesture elements.
     * @category Gesture
     */
    cleanupSlide () {
        if (this.dragDeleteButtonView()) {
            this.dragDeleteButtonView().removeFromParentView();
            this.setDragDeleteButtonView(null);
        }
        this.setTouchRight(null);
    }

    /**
     * @description Handles the slide movement.
     * @param {Object} slideGesture - The slide gesture object.
     * @category Gesture
     */
    onSlideMove (slideGesture) {
        const d = slideGesture.distance();
        const isReadyToDelete = d >= this._slideDeleteOffset;

        this.setTouchRight(d);

        if (this._dragDeleteButtonView) {
            this._dragDeleteButtonView.setOpacity(isReadyToDelete ? 1 : 0.2);
        }
    }

    /**
     * @description Sets the right position of the touch point.
     * @param {number} v - The right position value.
     * @category Gesture
     */
    setTouchRight (v) {
        this.contentView().setRightPx(v);
    }

    /**
     * @description Handles the completion of the slide gesture.
     * @param {Object} slideGesture - The slide gesture object.
     * @category Gesture
     */
    onSlideComplete (slideGesture) {
        const d = slideGesture.distance();
        const isReadyToDelete  = d >= this._slideDeleteOffset;

        this.element().style.backgroundColor = "transparent";

        if (isReadyToDelete) {
            this.finishSlideAndDelete();
        } else {
            this.slideBack();
        }
    }

    /**
     * @description Handles the cancellation of the slide gesture.
     * @param {Object} aGesture - The gesture object.
     * @category Gesture
     */
    onSlideCancelled (/*aGesture*/) {
        this.slideBack();
    }

    /**
     * @description Finishes the slide gesture and deletes the tile.
     * @category Gesture
     */
    finishSlideAndDelete () {
        const dt = 0.08; // seconds
        this.contentView().setTransition("right " + dt + "s");
        this.setTransition(this.transitionStyle());

        this.addWeakTimeout(() => {
            this.setTouchRight(this.clientWidth());
            this.addWeakTimeout(() => {
                this.cleanupSlide();
                this.delete();
            }, dt * 1000);
        }, 0);
    }

    /**
     * @description Slides the tile back to its original position.
     * @category Gesture
     */
    slideBack () {
        this.disableTilesViewUntilTimeout(400);

        this.contentView().setTransition("left 0.2s ease, right 0.2s ease");

        this.addWeakTimeout(() => {
            this.setTouchRight(0);
            this.contentView().setTransition(this.transitionStyle());
        });

        this.addWeakTimeout(() => {
            this.didCompleteSlide();
        }, 300);
    }

    /**
     * @description Disables pointer events on the tiles view for a specified duration.
     * @param {number} ms - The duration in milliseconds.
     * @category Interaction
     */
    disableTilesViewUntilTimeout (ms) {
        this.navView().disablePointerEventsUntilTimeout(ms);
        this.setPointerEvents("none");
    }

    /**
     * @description Performs actions after completing the slide.
     * @category Gesture
     */
    didCompleteSlide () {
        this.cleanupSlide();
    }

    /**
     * @description Checks if the tile has a close button.
     * @returns {boolean} True if the tile has a close button, false otherwise.
     * @category Appearance
     */
    hasCloseButton () {
        return this.closeButtonView() && this.closeButtonView().target() != null;
    }

}.initThisCategory());
