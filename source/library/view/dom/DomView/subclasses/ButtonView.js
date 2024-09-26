/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class ButtonView
 * @extends FlexDomView
 * @classdesc A simple push button view with a TextView label.
 * 
 * CSS Styles:
 * .BMActionFieldView {
 *     min-height: 28px;
 *     padding-top: 8px;
 *     padding-bottom: 8px;
 *     background-color: #888;
 *     color: #ccc;
 *     border-style: none;
 *     border-radius: 5px;
 *     border-width: 1px;
 *     border-color:#888;
 *     text-align: center;
 *     vertical-align: center;
 * }
 * 
 * .BMActionFieldView:hover {
 *     color: white;
 *     background-color: #888;
 * }
 */
"use strict";

(class ButtonView extends FlexDomView {
    
    initPrototypeSlots () {
        /**
         * @member {TextField} titleView - The view for displaying the button's title.
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("TextField");
        }
        /**
         * @member {TextField} subtitleView - The view for displaying the button's subtitle.
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("TextField");
        }
        /**
         * @member {Boolean} isEnabled - Indicates whether the button is enabled or disabled.
         */
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {SvgIconView} iconView - The view for displaying an icon on the button.
         */
        {
            const slot = this.newSlot("iconView", null);
            slot.setSlotType("SvgIconView");
        }
        /**
         * @member {Object} info - Additional information associated with the button.
         */
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the ButtonView.
     * @returns {ButtonView} The initialized ButtonView instance.
     */
    init () {
        super.init()
        this.setDisplay("flex")
        this.setFlexDirection("column")
        this.flexCenterContent()
        this.setHeight("fit-content")
        this.setWidth("100%")
        this.setMinHeight("1em")

        this.setPaddingTop("0.75em")
        this.setPaddingBottom("0.85em")

        this.setPaddingLeft("1em")
        this.setPaddingRight("1em")

        this.turnOffUserSelect()
        this.setBorderRadiusPx(1)

        {
            const view = TextField.clone()
            this.setTitleView(view)
            this.addSubview(view)
            view.fillParentView()
            view.setPaddingTop("0.1em").setPaddingBottom("0.1em")
            view.setPaddingLeft("1em").setPaddingRight("1em")
            view.flexCenterContent()
            view.setTextAlign("center")
            view.setMinHeight("1em")
            view.setWhiteSpace("nowrap")
            view.setTextOverflow("ellipsis")
        }

        {
            const view = TextField.clone()
            this.setSubtitleView(view)
            this.addSubview(view)
            view.fillParentView()
            view.setPaddingTop("0.1em").setPaddingBottom("0.1em")
            view.setPaddingLeft("1em").setPaddingRight("1em")
            view.flexCenterContent()
            view.setTextAlign("center")
            view.setMinHeight("fit-content")
            view.setWhiteSpace("pre-wrap")
            view.setTextOverflow("ellipsis")
            view.setFontSize("80%")
            view.setIsDisplayHidden(true);
        }

        this.setTitle("")

        const icon = SvgIconView.clone() //.setElementClassName("RightActionView")
        icon.setMinAndMaxWidth(12)
        icon.setMinAndMaxHeight(15)
        icon.setFillColor("white")
        icon.setStrokeColor("white")
        icon.setOpacity(1)
        icon.hideDisplay()
        this.setIconView(this.addSubview(icon))

        this.addDefaultTapGesture()

        return this
    }

    /**
     * @description Sets the icon name for the button.
     * @param {string} aName - The name of the icon to set.
     * @returns {ButtonView} The ButtonView instance.
     */
    setIconName (aName) {
        this.iconView().setIconName(aName)
        return this
    }

    /**
     * @description Sets the title of the button.
     * @param {string} s - The title to set.
     * @returns {ButtonView} The ButtonView instance.
     */
    setTitle (s) {
        if (s === "" || Type.isNullOrUndefined(s)) { 
            s = " "; // to avoid weird html layout issues
        }

        this.titleView().setValue(s)
        return this
    }

    /**
     * @description Gets the title of the button.
     * @returns {string} The current title of the button.
     */
    title () {
        return this.titleView().value()
    }

    /**
     * @description Sets the subtitle of the button.
     * @param {string} s - The subtitle to set.
     * @returns {ButtonView} The ButtonView instance.
     */
    setSubtitle (s) {
        const isEmpty = (s === "" || Type.isNullOrUndefined(s));
        this.subtitleView().setValue(s)
        this.subtitleView().setIsDisplayHidden(isEmpty)
        return this
    }

    /**
     * @description Gets the subtitle of the button.
     * @returns {string} The current subtitle of the button.
     */
    subtitle () {
        return this.subtitleView().value()
    }

    /**
     * @description Sets whether the button has an outline.
     * @param {boolean} aBool - True to add an outline, false to remove it.
     * @returns {ButtonView} The ButtonView instance.
     */
    setHasOutline (aBool) {
        if (aBool) {
            this.setBoxShadow("0px 0px 1px 1px rgba(255, 255, 255, 0.2)")
        } else {
            this.setBoxShadow("none")
        }
        return this
    }

    /**
     * @description Sets the visibility of the button's title.
     * @param {boolean} aBool - True to show the title, false to hide it.
     * @returns {ButtonView} The ButtonView instance.
     */
    setTitleIsVisible (aBool) {
        this.titleView().setIsDisplayHidden(!aBool)
        return this
    }

    /**
     * @description Sets whether the button is editable.
     * @param {boolean} aBool - True to make the button editable, false otherwise.
     * @returns {ButtonView} The ButtonView instance.
     */
    setIsEditable (aBool) {
        this.titleView().setIsEditable(aBool)
        return this
    }

    /**
     * @description Checks if the button is editable.
     * @returns {boolean} True if the button is editable, false otherwise.
     */
    isEditable () {
        return this.titleView().isEditable()
    }

    /**
     * @description Sends an action to the target if the button is not editable.
     * @returns {ButtonView} The ButtonView instance.
     */
    sendActionToTarget () {
        if (!this.isEditable()) {
            super.sendActionToTarget()
        }
        return this
    }

    /**
     * @description Handles the tap begin event.
     * @param {Object} aGesture - The gesture object.
     */
    onTapBegin (aGesture) {
        if (!this.isEnabled()) {
            aGesture.cancel()
            return
        }
        this.setBackgroundColor("rgba(255, 255, 255, 0.1)")
    }

    /**
     * @description Handles the tap cancelled event.
     * @param {Object} aGesture - The gesture object.
     */
    onTapCancelled (aGesture) {
        this.setBackgroundColor("rgba(255, 255, 255, 0.0)")
    }

    /**
     * @description Handles the tap complete event.
     * @param {Object} aGesture - The gesture object.
     * @returns {boolean} False to prevent default behavior.
     */
    onTapComplete (aGesture) {
        this.setBackgroundColor("rgba(255, 255, 255, 0.0)")
        this.sendActionToTarget()
        SimpleSynth.clone().playButtonTap()
        return false
    }
    
}.initThisClass());