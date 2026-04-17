/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvCloseButton
 * @extends SvFlexDomView
 * @classdesc SvCloseButton class representing a close button with an icon.
 * TODO: make subclass of SvButtonView?
 */
(class SvCloseButton extends SvFlexDomView {

    /**
     * @description Initializes the prototype slots for the SvCloseButton.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} isEnabled - Indicates whether the button is enabled.
         * @category State
         */
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {SvgIconView} iconView - The icon view for the close button.
         * @category View
         */
        {
            const slot = this.newSlot("iconView", null);
            slot.setSlotType("SvgIconView");
        }
    }

    /**
     * @description Initializes the SvCloseButton instance.
     * @returns {SvCloseButton} The initialized SvCloseButton instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.makeFlexAndCenterContent();
        this.setPadding("0em");
        this.turnOffUserSelect();
        //this.setDisplay("table") // to center svg

        const iv = SvgIconView.clone().setIconName("close");
        iv.setColor("white");

        iv.setMinAndMaxWidth(10);
        iv.setMinAndMaxHeight(10);

        //iv.setWidth("fit-content")
        //iv.setHeight("fit-content")

        iv.makeFlexAndCenterContent();
        //iv.setTopPx(0)
        //iv.setLeftPx(0)
        //iv.setMarginBottom("1px") // TODO: fix the SVG for this icon so this isn't needed?


        this.setIconView(iv);
        this.addSubview(iv);

        this.setAction("close");
        this.addDefaultTapGesture();
        return this;
    }

    /**
     * @description Sets the icon name for the button.
     * @param {string} aString - The name of the icon to set.
     * @returns {SvCloseButton} The SvCloseButton instance.
     * @category View
     */
    setIconName (aString) {
        this.iconView().setIconName(aString);
        return this;
    }

    // --- editable ---

    /**
     * @description Sets the enabled state of the button.
     * @param {boolean} aBool - The enabled state to set.
     * @returns {SvCloseButton} The SvCloseButton instance.
     * @category State
     */
    setIsEnabled (aBool) {
        if (this._isEnabled !== aBool) {
            this._isEnabled = aBool;
            this.syncEnabled();
        }

        return this;
    }

    /**
     * @description Synchronizes the enabled state of the button.
     * @returns {SvCloseButton} The SvCloseButton instance.
     * @category State
     */
    syncEnabled () {
        //this.setIsDisplayHidden(!this.isEnabled())
        return this;
    }

    /**
     * @description Handles the tap complete event.
     * @param {Object} aGesture - The gesture object.
     * @returns {boolean} False to indicate the event has been handled.
     * @category Event
     */
    onTapComplete (aGesture) {
        //this.logDebug(".onTapComplete()")
        if (!this.isEditable()) {
            this.sendActionToTarget();
        }
        return false;
    }

}.initThisClass());
