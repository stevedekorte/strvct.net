"use strict";

/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvImageZoomView
 * @extends SvDomView
 * @classdesc A temporary full-window view of one image, scaled to fit the
 * window over a dimmed backdrop. A tap anywhere closes it. Opened by an image
 * well whose node asks for it (SvViewableNode.nodeImageZoomsOnTap).
 *
 * Example:
 *
 *     SvImageZoomView.clone().setImageUrl(dataUrl).openInWindow();
 */
(class SvImageZoomView extends SvDomView {

    initPrototypeSlots () {
        {
            /**
             * @member {String} imageUrl - the image shown (a data or blob URL)
             * @category Image
             */
            const slot = this.newSlot("imageUrl", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        this.setPosition("fixed");
        this.setTop("0px").setLeft("0px").setRight("0px").setBottom("0px");
        this.setZIndex(10000);
        this.setCssProperty("background-color", "var(--sv-surface-scrim, rgba(0, 0, 0, 0.88))");
        this.setCssProperty("background-repeat", "no-repeat");
        this.setCssProperty("background-position", "center");
        this.setCssProperty("background-size", "contain");
        this.setCssProperty("cursor", "zoom-out");
        this.setCssProperty("box-sizing", "border-box");
        this.setCssProperty("background-origin", "content-box");
        this.setPadding("max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))");
        this.turnOffUserSelect();
        this.addDefaultTapGesture();
        return this;
    }

    /**
     * @description Shows the image (as the view's fitted background).
     * @param {String} url
     * @category Image
     */
    didUpdateSlotImageUrl (oldValue, newValue) {
        this.setBackgroundImage(newValue ? "url(\"" + newValue + "\")" : "none");
    }

    /**
     * @description Puts the view over the main window.
     * @returns {SvImageZoomView}
     * @category Lifecycle
     */
    openInWindow () {
        SvApp.shared().userInterface().mainWindow().documentBody().addSubview(this);
        return this;
    }

    /**
     * @description A tap anywhere closes it.
     * @category Lifecycle
     */
    onTapComplete (/*aGesture*/) {
        this.close();
    }

    close () {
        if (this.parentView()) {
            this.removeFromParentView();
        }
        return this;
    }

}.initThisClass());
