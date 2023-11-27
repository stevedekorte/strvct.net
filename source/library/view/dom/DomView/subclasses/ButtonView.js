"use strict";

/*

    ButtonView

    A simple push button view with a TextView label.


    .BMActionFieldView {
        min-height: 28px;

        padding-top: 8px;
        padding-bottom: 8px;

        background-color: #888;
        color: #ccc;

        border-style: none;
        border-radius: 5px;
        border-width: 1px;
        border-color:#888;
        
        text-align: center;
        vertical-align: center;

    }

    .BMActionFieldView:hover {
        color: white;
        background-color: #888;
    }

*/

(class ButtonView extends FlexDomView {
    
    initPrototypeSlots () {
        this.newSlot("titleView", null)
        this.newSlot("subtitleView", null)
        this.newSlot("isEnabled", true)
        this.newSlot("iconView", null)
        this.newSlot("info", null)
    }

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
            view.setMinHeight("1em")
            view.setWhiteSpace("nowrap")
            view.setTextOverflow("ellipsis")
            view.setFontSize("80%")
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

    setIconName (aName) {
        this.iconView().setIconName(aName)
        return this
    }

    // --- title ---

    setTitle (s) {
        if (s === "" || Type.isNullOrUndefined(s)) { 
            s = " "; // to avoid weird html layout issues
        }

        this.titleView().setValue(s)
        //this.titleView().setIsDisplayHidden(!s)
        return this
    }

    title () {
        return this.titleView().value()
    }

    // --- subtitle ---

    setSubtitle (s) {
        //console.log(this.typeId() + ".setSubtitle('" + s + "')")
        const isEmpty = (s === "" || Type.isNullOrUndefined(s));
        this.subtitleView().setValue(s)
        this.subtitleView().setIsDisplayHidden(isEmpty)
        return this
    }

    subtitle () {
        return this.subtitleView().value()
    }

    // ------

    setHasOutline (aBool) {
        if (aBool) {
            this.setBoxShadow("0px 0px 1px 1px rgba(255, 255, 255, 0.2)")
        } else {
            this.setBoxShadow("none")
        }
        return this
    }

    setTitleIsVisible (aBool) {
        this.titleView().setIsDisplayHidden(!aBool)
        return this
    }

    setIsEditable (aBool) {
        this.titleView().setIsEditable(aBool)
        return this
    }

    isEditable () {
        return this.titleView().isEditable()
    }

    sendActionToTarget () {
        if (!this.isEditable()) {
            super.sendActionToTarget()
        }
        return this
    }

    onTapBegin (aGesture) {
        if (!this.isEnabled()) {
            aGesture.cancel()
            return
        }
        this.setBackgroundColor("rgba(255, 255, 255, 0.1)")
        //SimpleSynth.clone().playButtonDown()
    }

    onTapCancelled (aGesture) {
        this.setBackgroundColor("rgba(255, 255, 255, 0.0)")
        //SimpleSynth.clone().playButtonCancelled()
    }

    onTapComplete (aGesture) {
        //this.debugLog(".onTapComplete()")
        //const bgColor = this.backgroundColor();
        //setTimeout(() => { this.setBackgroundColor(bgColor) }, 100);
        //this.setBackgroundColor("rgba(255, 255, 255, 0.2)")
        this.setBackgroundColor("rgba(255, 255, 255, 0.0)")
        this.sendActionToTarget()
        //SimpleSynth.clone().playButtonUp()
        SimpleSynth.clone().playButtonTap()
        return false
    }
    
}.initThisClass());
