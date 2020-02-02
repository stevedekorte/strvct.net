"use strict"

/*

    ButtonView

    A simple push button view with a TextView label.


    .BMActionNodeView {
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

        transition: all 0.1 ease;
    }

    .BMActionNodeView:hover {
        color: white;
        background-color: #888;
        transition: opacity background-color 1s ease;
    }

*/

window.ButtonView = class ButtonView extends DomView {
    
    initPrototype () {
        this.newSlot("titleView", null)
        this.newSlot("isEnabled", true)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.flexCenterContent()
        this.setHeight("fit-content")
        this.setWidth("100%")
        this.setMinHeight("1em")

        this.setPaddingTop("0.75em")
        this.setPaddingBottom("0.85em")

        this.setPaddingLeft("1em")
        this.setPaddingRight("1em")

        this.turnOffUserSelect()
        this.setBoxShadow("0px 0px 1px 1px rgba(255, 255, 255, 0.2)")
        this.setBorderRadius("1px")
        
        this.setTitleView(TextField.clone())
        this.addSubview(this.titleView())
        this.titleView().fillParentView()
        this.titleView().setPaddingTop("0em").setPaddingBottom("0em")
        this.titleView().setPaddingLeft("1em").setPaddingRight("1em")
        this.titleView().flexCenterContent()
        
        this.setTitle("")

        /*
        this.styles().unselected().setColor("#888")
        this.styles().unselected().setBackgroundColor("white")

        this.styles().selected().setColor("#888")
        this.styles().selected().setBackgroundColor("#eee")
        */

        /*
        this.setIconName("close")
        this.setBackgroundSizeWH(10, 10) // use "contain" instead?
        this.setBackgroundPosition("center")
        this.makeBackgroundNoRepeat()
        this.setAction("close") //.setInnerHTML("&#10799;")
        */

        this.addDefaultTapGesture()

        return this
    }

    setTitle (s) {
        this.titleView().setValue(s)
        return this
    }

    title () {
        return this.titleView().value()
    }

    /*
    setIconName (aString) {
        this.setBackgroundImageUrlPath(this.pathForIconName(aString))
        return this
    }
    */

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

    onTapComplete (aGesture) {
        //this.debugLog(".onTapComplete()")
        this.sendActionToTarget()
        return false
    }
    
}.initThisClass()
